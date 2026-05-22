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
 * Generate seat array for a ride based on vehicle type
 * @param {string} rideId - The ride ID
 * @param {string} vehicleType - The vehicle type (hatchback, sedan, suv, mpv, van)
 * @returns {Array} Array of seat objects
 */
const generateSeats = (rideId, vehicleType = 'sedan') => {
  const layout = VEHICLE_LAYOUTS[vehicleType] || VEHICLE_LAYOUTS.sedan;
  const seats = [];
  
  layout.layout.forEach((row) => {
    row.seats.forEach((seat) => {
      seats.push({
        rideId,
        seatNumber: `${row.row}${seat.num}`,
        row: row.row,
        position: seat.num,
        type: seat.type,
        status: seat.type === 'driver' ? 'booked' : 'available'
      });
    });
  });
  
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
