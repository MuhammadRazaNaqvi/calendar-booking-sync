import { useEffect, useState, useCallback } from "react";
import Header from "./components/Header.jsx";
import VehiclePanel from "./components/VehiclePanel.jsx";
import BookingCalendar from "./components/BookingCalendar.jsx";
import ActivityFeed from "./components/ActivityFeed.jsx";
import BookingDetailModal from "./components/BookingDetailModal.jsx";
import { getVehicles, getBookings, createBooking, updateBooking, deleteBooking, syncTuro } from "./api.js";

function newActivity(type, title, subtitle) {
  return { id: crypto.randomUUID(), type, title, subtitle };
}

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [activity, setActivity] = useState([]);
  const [bookingForm, setBookingForm] = useState({ startDate: "", endDate: "", renterName: "" });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingActionSaving, setBookingActionSaving] = useState(false);
  const [bookingActionError, setBookingActionError] = useState(null);

  useEffect(() => {
    getVehicles().then((data) => {
      setVehicles(data);
      if (data.length > 0) setSelectedVehicleId(data[0].id);
    });
  }, []);

  const refetchBookings = useCallback(() => {
    if (!selectedVehicleId) return;
    getBookings(selectedVehicleId).then(setBookings);
  }, [selectedVehicleId]);

  useEffect(() => {
    refetchBookings();
    setFormMessage(null);
  }, [refetchBookings]);

  const vehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;

  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const stats = {
    thisMonth: bookings.filter((b) => b.start_date.startsWith(thisMonthPrefix)).length,
    conflicts: bookings.filter((b) => b.status === "flagged_conflict").length,
  };

  async function handleSync() {
    if (!selectedVehicleId) return;
    setSyncing(true);
    try {
      const result = await syncTuro(selectedVehicleId);
      refetchBookings();
      setLastSyncedAt(new Date());

      const entries = [];
      if (result.imported.length > 0) {
        const ranges = result.imported.map((b) => `${b.start_date} to ${b.end_date}`).join(", ");
        entries.push(newActivity("sync", `Synced ${result.imported.length} Turo booking(s)`, ranges));
      } else {
        entries.push(newActivity("sync", "Turo sync complete", `No new bookings (skipped ${result.skipped})`));
      }
      for (const conflict of result.conflicts) {
        entries.push(
          newActivity(
            "conflict",
            "Heads up — conflict detected",
            `Turo booking overlaps direct booking ${conflict.conflictingBooking.start_date} to ${conflict.conflictingBooking.end_date}`
          )
        );
      }
      setActivity((prev) => [...entries, ...prev]);
    } finally {
      setSyncing(false);
    }
  }

  function handleBookingFieldChange(field, value) {
    setBookingForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleBookingSubmit(e) {
    e.preventDefault();
    setBookingSubmitting(true);
    setFormMessage(null);
    try {
      const payload = { vehicleId: selectedVehicleId, ...bookingForm };
      await createBooking(payload);
      refetchBookings();
      setFormMessage({ type: "success", text: "Booking confirmed" });
      setActivity((prev) => [
        newActivity(
          "success",
          "Booking confirmed",
          `Direct booking ${bookingForm.startDate} to ${bookingForm.endDate} for ${bookingForm.renterName}`
        ),
        ...prev,
      ]);
      setBookingForm({ startDate: "", endDate: "", renterName: "" });
    } catch (err) {
      if (err.response?.status === 409) {
        const conflicting = err.response.data.conflictingBooking;
        setFormMessage({
          type: "conflict",
          text: `Conflicts with an existing ${conflicting.source} booking (${conflicting.start_date} to ${conflicting.end_date})`,
        });
        setActivity((prev) => [
          newActivity(
            "conflict",
            "Heads up — conflict detected",
            `New direct booking overlaps ${conflicting.source} reservation ${conflicting.start_date} to ${conflicting.end_date}`
          ),
          ...prev,
        ]);
      } else {
        setFormMessage({ type: "conflict", text: "Something went wrong creating this booking." });
      }
    } finally {
      setBookingSubmitting(false);
    }
  }

  function handleSelectEvent(booking) {
    setBookingActionError(null);
    setSelectedBooking(booking);
  }

  function handleCloseModal() {
    setSelectedBooking(null);
    setBookingActionError(null);
  }

  async function handleUpdateBooking(id, payload) {
    setBookingActionSaving(true);
    setBookingActionError(null);
    try {
      await updateBooking(id, payload);
      refetchBookings();
      setActivity((prev) => [
        newActivity(
          "success",
          "Booking updated",
          `${payload.startDate} to ${payload.endDate} for ${payload.renterName}`
        ),
        ...prev,
      ]);
      setSelectedBooking(null);
    } catch (err) {
      if (err.response?.status === 409) {
        const conflicting = err.response.data.conflictingBooking;
        setBookingActionError(
          `Conflicts with an existing ${conflicting.source} booking (${conflicting.start_date} to ${conflicting.end_date})`
        );
      } else {
        setBookingActionError(err.response?.data?.error ?? "Something went wrong updating this booking.");
      }
    } finally {
      setBookingActionSaving(false);
    }
  }

  async function handleDeleteBooking(id) {
    setBookingActionSaving(true);
    setBookingActionError(null);
    try {
      await deleteBooking(id);
      refetchBookings();
      setActivity((prev) => [newActivity("success", "Booking deleted", "Direct booking removed"), ...prev]);
      setSelectedBooking(null);
    } catch (err) {
      setBookingActionError(err.response?.data?.error ?? "Something went wrong deleting this booking.");
    } finally {
      setBookingActionSaving(false);
    }
  }

  return (
    <div className="bg-gradient-to-b from-orange-50 to-slate-100 text-slate-800 min-h-screen">
      <Header lastSyncedAt={lastSyncedAt} notifications={activity.slice(0, 5)} />

      <div className="max-w-6xl mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-stretch">
        <VehiclePanel
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={setSelectedVehicleId}
          vehicle={vehicle}
          onSync={handleSync}
          syncing={syncing}
          stats={stats}
          bookingForm={bookingForm}
          onBookingFieldChange={handleBookingFieldChange}
          onBookingSubmit={handleBookingSubmit}
          bookingSubmitting={bookingSubmitting}
          formMessage={formMessage}
        />
        <BookingCalendar bookings={bookings} onSelectEvent={handleSelectEvent} />
      </div>

      <ActivityFeed items={activity} />

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={handleCloseModal}
          onUpdate={handleUpdateBooking}
          onDelete={handleDeleteBooking}
          saving={bookingActionSaving}
          error={bookingActionError}
        />
      )}
    </div>
  );
}
