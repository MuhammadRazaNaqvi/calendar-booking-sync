import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const directory = mkdtempSync(path.join(tmpdir(), "booking-test-"));
process.env.DB_PATH = path.join(directory, "data.sqlite");
const { db } = await import("../src/db.js");
const { seedDemo } = await import("../src/seed.js");
const { app } = await import("../src/index.js");

function futureDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

test("baseline, incremental Turo sync, conflict resolution and reset", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(method, route, body) {
    const response = await fetch(`${base}${route}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  }
  const reservation = (start = 30, end = 33) => ({ vehicleId: 1, startDate: futureDate(start), endDate: futureDate(end), renterName: "Demo guest" });
  try {
    seedDemo();
    seedDemo();
    const mockPage = await fetch(`${base.replace(/\/api$/, '')}/mock-turo`);
    assert.equal(mockPage.status, 200);
    assert.ok((await mockPage.text()).includes('Source reservations'));
    assert.equal((await fetch(`${base}/vehicles/1/calendar.ics`)).status, 404);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM vehicles").get().count, 5);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM bookings").get().count, 10);
    for (const vehicle of db.prepare("SELECT * FROM vehicles").all()) {
      const reservations = db.prepare("SELECT * FROM bookings WHERE vehicle_id = ?").all(vehicle.id);
      assert.equal(reservations.length, 2);
      assert.ok(vehicle.plate && vehicle.photo_url && vehicle.color && vehicle.seats);
      assert.ok(reservations.find(booking => booking.source === "turo").renter_name.includes("Trip TR-"));
    }
    const baseline = (await request("GET", "/vehicles/1/bookings")).body;
    assert.deepEqual(new Set(baseline.map(booking => booking.source)), new Set(["direct", "turo"]));
    assert.equal((await request("POST", "/vehicles/1/sync-turo")).body.imported.length, 0);

    const direct = await request("POST", "/bookings", reservation());
    assert.equal(direct.status, 201);
    const mock = await request("POST", "/vehicles/1/mock-turo/events", reservation());
    assert.equal(mock.status, 201);
    const pending = (await request("GET", "/vehicles/1/mock-turo/events")).body.find(event => event.uid === mock.body.uid);
    assert.equal(pending.imported, 0);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE external_uid = ?").get(mock.body.uid).count, 0);
    const sourceResponse = await fetch(`${base}/vehicles/1/mock-turo/calendar.ics`);
    assert.ok((await sourceResponse.text()).includes(mock.body.uid));
    const sync = (await request("POST", "/vehicles/1/sync-turo")).body;
    assert.equal(sync.imported.length, 1);
    const importedEvent = (await request("GET", "/vehicles/1/mock-turo/events")).body.find(event => event.uid === mock.body.uid);
    assert.equal(importedEvent.imported, 1);
    assert.equal(sync.imported[0].start_date, mock.body.start_date);
    assert.equal(sync.imported[0].end_date, mock.body.end_date);
    assert.equal(sync.imported[0].status, "flagged_conflict");
    assert.equal(sync.conflicts.length, 1);
    assert.equal((await request("POST", "/bookings", reservation())).status, 409);
    assert.equal((await request("POST", "/vehicles/1/sync-turo")).body.imported.length, 0);
    assert.equal((await request("POST", "/vehicles/2/sync-turo")).body.conflicts.length, 0);
    assert.equal((await request("PUT", `/bookings/${sync.imported[0].id}`, reservation())).status, 400);
    assert.equal((await request("DELETE", `/bookings/${sync.imported[0].id}`)).status, 400);

    assert.equal((await request("PUT", `/bookings/${direct.body.id}`, reservation(34, 35))).status, 200);
    assert.equal((await request("GET", "/vehicles/1/bookings")).body.filter(booking => booking.status === "flagged_conflict").length, 0);
    const another = await request("POST", "/vehicles/1/mock-turo/events", reservation(34, 35));
    assert.equal(another.status, 201);
    await request("POST", "/vehicles/1/sync-turo");
    assert.equal((await request("DELETE", `/bookings/${direct.body.id}`)).status, 204);
    assert.equal((await request("GET", "/vehicles/1/bookings")).body.filter(booking => booking.status === "flagged_conflict").length, 0);

    const first = await request("POST", "/bookings", reservation(40, 41));
    const second = await request("POST", "/bookings", reservation(42, 43));
    assert.equal(first.status, 201, JSON.stringify(first.body));
    assert.equal(second.status, 201, JSON.stringify(second.body));
    await request("POST", "/vehicles/1/mock-turo/events", reservation(40, 43));
    assert.equal((await request("POST", "/vehicles/1/sync-turo")).body.conflicts.length, 2);
    await request("DELETE", `/bookings/${first.body.id}`);
    assert.equal((await request("POST", "/vehicles/1/sync-turo")).body.conflicts.length, 1);
    await request("DELETE", `/bookings/${second.body.id}`);
    assert.equal((await request("POST", "/vehicles/1/sync-turo")).body.conflicts.length, 0);
    assert.equal((await request("POST", "/bookings", reservation(43, 44))).status, 201);

    for (const invalid of [null, {}, { ...reservation(), startDate: "zzzz" }, { ...reservation(), startDate: "2099-02-30", endDate: "2099-03-03" }, { ...reservation(), renterName: " " }, { ...reservation(), startDate: 123 }, { ...reservation(), endDate: futureDate(30) }, { ...reservation(), startDate: "2000-01-01" }]) {
      assert.equal((await request("POST", "/bookings", invalid)).status, 400);
      assert.equal((await request("POST", "/vehicles/1/mock-turo/events", invalid)).status, 400);
    }
    assert.equal((await request("POST", "/bookings", { ...reservation(), vehicleId: 999 })).status, 404);
    assert.equal((await request("POST", "/vehicles/999/mock-turo/events", reservation())).status, 404);
    execFileSync(process.execPath, [new URL("../src/reset-db.js", import.meta.url).pathname], { env: process.env });
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM bookings").get().count, 10);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM mock_turo_events").get().count, 5);
    assert.equal((await request("POST", "/vehicles/1/sync-turo")).body.imported.length, 0);
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});