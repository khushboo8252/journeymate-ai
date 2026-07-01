const express = require("express");
const Ride = require("../models/Ride");

// Helper to generate beautifully scannable 12-hour slots with 15-minute intervals
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

const generateSeats = (rideId, vehicleType = 'sedan', customSeatsTotal = null) => {
  const layout = VEHICLE_LAYOUTS[vehicleType] || VEHICLE_LAYOUTS.sedan;
  const seats = [];
  
  // 🚨 [FIX]: Passenger seats count ke alawa 1 driver seat extra calculate hogi array matrix me
  const passengerSeatsLimit = customSeatsTotal ? Number(customSeatsTotal) : layout.totalSeats;
  const actualTargetTotal = passengerSeatsLimit + 1; 

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  let seatCounter = 1;

  for (let i = 0; i < rows.length && seatCounter <= actualTargetTotal; i++) {
    const row = rows[i];
    const seatsInRow = i === 0 ? 2 : 3;

    for (let j = 0; j < seatsInRow && seatCounter <= actualTargetTotal; j++) {
      const isDriver = i === 0 && j === 0;
      const seatType = isDriver ? 'driver' : (j === 0 || j === seatsInRow - 1 ? 'window' : 'middle');

      seats.push({
        rideId,
        seatNumber: `${row}${j + 1}`,
        row: row,
        position: j + 1,
        type: seatType,
        status: isDriver ? 'booked' : 'available' // Driver auto-booked rahega taaki select na ho sake, baaki passenger seats khuli rahengi
      });

      seatCounter++;
    }
  }

  return seats;
};

const getVehicleLayout = (vehicleType) => VEHICLE_LAYOUTS[vehicleType] || VEHICLE_LAYOUTS.sedan;
const getTotalSeats = (vehicleType) => {
  const layout = VEHICLE_LAYOUTS[vehicleType];
  return layout ? layout.totalSeats : 5;
};
const calculateAvailableSeats = (seats) => seats.filter(seat => seat.status === 'available' && seat.type !== 'driver').length;

module.exports = {
  generateSeats,
  getVehicleLayout,
  getTotalSeats,
  calculateAvailableSeats,
  VEHICLE_LAYOUTS
};