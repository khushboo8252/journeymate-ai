const VEHICLE_LAYOUTS = {
  hatchback: {
    totalSeats: 5,
    layout: [
      { row: 'A', seats: [{ num: 1, type: 'driver' }, { num: 2, type: 'window' }] },
      { row: 'B', seats: [{ num: 1, type: 'window' }, { num: 2, type: 'middle' }, { num: 3, type: 'window' }] }
    ]
  },
  sedan: {
    totalSeats: 5,
    layout: [
      { row: 'A', seats: [{ num: 1, type: 'driver' }, { num: 2, type: 'window' }] },
      { row: 'B', seats: [{ num: 1, type: 'window' }, { num: 2, type: 'middle' }, { num: 3, type: 'window' }] }
    ]
  },
  suv: {
    totalSeats: 7,
    layout: [
      { row: 'A', seats: [{ num: 1, type: 'driver' }, { num: 2, type: 'window' }] },
      { row: 'B', seats: [{ num: 1, type: 'window' }, { num: 2, type: 'middle' }, { num: 3, type: 'window' }] },
      { row: 'C', seats: [{ num: 1, type: 'window' }, { num: 2, type: 'middle' }] }
    ]
  },
  mpv: {
    totalSeats: 7,
    layout: [
      { row: 'A', seats: [{ num: 1, type: 'driver' }, { num: 2, type: 'window' }] },
      { row: 'B', seats: [{ num: 1, type: 'window' }, { num: 2, type: 'middle' }, { num: 3, type: 'window' }] },
      { row: 'C', seats: [{ num: 1, type: 'window' }, { num: 2, type: 'middle' }] }
    ]
  },
  van: {
    totalSeats: 10,
    layout: [
      { row: 'A', seats: [{ num: 1, type: 'driver' }, { num: 2, type: 'window' }] },
      { row: 'B', seats: [{ num: 1, type: 'window' }, { num: 2, type: 'middle' }, { num: 3, type: 'window' }] },
      { row: 'C', seats: [{ num: 1, type: 'window' }, { num: 2, type: 'middle' }, { num: 3, type: 'window' }] },
      { row: 'D', seats: [{ num: 1, type: 'window' }, { num: 2, type: 'middle' }, { num: 3, type: 'window' }] }
    ]
  }
};

/**
 * Generate seat array for a ride based on vehicle type and custom seat count
 * @param {string} rideId - The ride ID
 * @param {string} vehicleType - The vehicle type (hatchback, sedan, suv, mpv, van)
 * @param {number} customSeatsTotal - Custom total seats (optional)
 * @returns {Array} Array of seat objects
 */
const generateSeats = (rideId, vehicleType = 'sedan', customSeatsTotal = null) => {
  const layout = VEHICLE_LAYOUTS[vehicleType] || VEHICLE_LAYOUTS.sedan;
  const seats = [];
  const totalSeats = customSeatsTotal || layout.totalSeats;

  // Generate seats dynamically based on totalSeats
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  let seatCounter = 1;

  for (let i = 0; i < rows.length && seatCounter <= totalSeats; i++) {
    const row = rows[i];
    const seatsInRow = i === 0 ? 2 : 3; // First row has driver + 1 passenger, others have 3

    for (let j = 0; j < seatsInRow && seatCounter <= totalSeats; j++) {
      const isDriver = i === 0 && j === 0;
      const seatType = isDriver ? 'driver' : (j === 0 || j === seatsInRow - 1 ? 'window' : 'middle');

      seats.push({
        rideId,
        seatNumber: `${row}${j + 1}`,
        row: row,
        position: j + 1,
        type: seatType,
        status: isDriver ? 'booked' : 'available'
      });

      seatCounter++;
    }
  }

  return seats;
};

/**
 * Get vehicle layout configuration
 * @param {string} vehicleType - The vehicle type
 * @returns {Object} Vehicle layout configuration
 */
const getVehicleLayout = (vehicleType) => {
  return VEHICLE_LAYOUTS[vehicleType] || VEHICLE_LAYOUTS.sedan;
};

/**
 * Get total seats for a vehicle type
 * @param {string} vehicleType - The vehicle type
 * @returns {number} Total seats
 */
const getTotalSeats = (vehicleType) => {
  const layout = VEHICLE_LAYOUTS[vehicleType];
  return layout ? layout.totalSeats : 5;
};

/**
 * Calculate seats available from seat array
 * @param {Array} seats - Array of seat objects
 * @returns {number} Number of available seats
 */
const calculateAvailableSeats = (seats) => {
  return seats.filter(seat => seat.status === 'available').length;
};

/**
 * Get seat label for display (Window, Middle, etc.)
 * @param {string} type - Seat type
 * @param {number} position - Position in row
 * @param {number} rowLength - Total seats in row
 * @returns {string} Seat label
 */
const getSeatLabel = (type, position, rowLength) => {
  if (type === 'driver') return 'Driver';
  if (rowLength === 1) return '';
  if (position === 1 || position === rowLength) return 'Window';
  return 'Middle';
};

module.exports = {
  generateSeats,
  getVehicleLayout,
  getTotalSeats,
  calculateAvailableSeats,
  getSeatLabel,
  VEHICLE_LAYOUTS
};
