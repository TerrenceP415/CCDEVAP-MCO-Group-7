// Flight catalog used across search results and booking pages
const sampleFlights = [
  {
    id: "FL-001",
    airlineLogo: "public/airline/philippine-airlines.png",
    airlineName: "Philippine Arlines",
    flightNumber: "PR-102",
    origin: "MNL",
    destination: "LAX",
    arrivalDate: "2024-07-15",
    departureDate: "2024-07-14",
    departureTime: "08:30 AM",
    arrivalTime: "07:15 PM",
    duration: "14h 45m",
    layovers: 0,
    price: 850.00,
    class: "Economy",
    remainingSeats: 5
  },
  {
    id: "FL-002",
    airlineLogo: "public/airline/cebu-pacific.png",
    airlineName: "Cebu Pacific",
    flightNumber: "FF-305",
    origin: "MNL",
    destination: "SIN",
    departureDate: "2024-07-14",
    arrivalDate: "2024-07-14",
    departureTime: "01:15 PM",
    arrivalTime: "04:50 PM",
    duration: "3h 35m",
    layovers: 0,
    price: 180.00,
    class: "Economy",
    remainingSeats: 12
  },
  {
    id: "FL-003",
    airlineLogo: "public/airline/singapore-airlines.png",
    airlineName: "Singapore Airlines",
    flightNumber: "PS-882",
    origin: "MNL",
    destination: "NRT",
    departureDate: "2024-07-14",
    arrivalDate: "2024-07-14",
    departureTime: "06:00 AM",
    arrivalTime: "11:30 AM",
    duration: "4h 30m",
    layovers: 0,
    price: 450.00,
    class: "Business",
    remainingSeats: 3
  },
  {
    id: "FL-004",
    airlineLogo: "public/airline/philippine-airlines.png",
    airlineName: "Philippine Airlines",
    flightNumber: "PR-426",
    origin: "MNL",
    destination: "NRT",
    departureDate: "2024-07-14",
    arrivalDate: "2024-07-14",
    departureTime: "09:45 AM",
    arrivalTime: "04:15 PM",
    duration: "5h 30m",
    layovers: 1,
    price: 320.00,
    class: "Premium Economy",
    remainingSeats: 8
  },
  {
    id: "FL-005",
    airlineLogo: "public/airline/emirates.png",
    airlineName: "Emirates",
    flightNumber: "GJ-011",
    origin: "MNL",
    destination: "DXB",
    departureDate: "2024-07-14",
    arrivalDate: "2024-07-15",
    departureTime: "11:20 PM",
    arrivalTime: "04:40 AM",
    duration: "9h 20m",
    layovers: 1,
    price: 620.00,
    class: "Economy",
    remainingSeats: 0
  },
  {
    id: "FL-006",
    airlineLogo: "public/airline/singapore-airlines.png",
    airlineName: "Singapore Airlines",
    flightNumber: "PS-009",
    origin: "MNL",
    destination: "LAX",
    departureDate: "2024-07-14",
    arrivalDate: "2024-07-15",
    departureTime: "10:00 PM",
    arrivalTime: "09:30 PM",
    duration: "16h 30m",
    layovers: 2,
    price: 1250.00,
    class: "Business",
    remainingSeats: 4
  },
  {
    id: "FL-007",
    airlineLogo: "public/airline/cebu-pacific.png",
    airlineName: "Cebu Pacific",
    flightNumber: "FF-112",
    origin: "MNL",
    destination: "HKG",
    departureDate: "2024-07-14",
    arrivalDate: "2024-07-14",
    departureTime: "07:10 AM",
    arrivalTime: "09:25 AM",
    duration: "2h 15m",
    layovers: 0,
    price: 110.00,
    class: "Economy",
    remainingSeats: 22
  },
  {
    id: "FL-008",
    airlineLogo: "public/airline/emirates.png",
    airlineName: "Emirates",
    flightNumber: "GJ-702",
    origin: "MNL",
    destination: "LHR",
    departureDate: "2024-07-14",
    arrivalDate: "2024-07-14",
    departureTime: "12:05 PM",
    arrivalTime: "09:15 PM",
    duration: "14h 10m",
    layovers: 1,
    price: 2400.00,
    class: "First Class",
    remainingSeats: 2
  }
];

// Meal add-ons available during booking
const mealPackages = [
  { id: "M01", name: "Standard Meal", description: "Chef's selection hot meal with beverage", price: 0.00 },
  { id: "M02", name: "Vegetarian", description: "Plant-based meal excluding meat and seafood", price: 5.00 },
  { id: "M03", name: "Vegan", description: "Strictly egg-free, dairy-free plant meal", price: 6.50 },
  { id: "M04", name: "Halal", description: "Certified Halal prepared ingredients", price: 8.00 },
  { id: "M05", name: "Kosher", description: "Certified Kosher prepared ingredients", price: 9.50 },
  { id: "M06", name: "Gluten-Free", description: "Meals designed without gluten-containing elements", price: 7.00 }
];

// Reservation records shown on the My Reservations page
const sampleReservations = [
  {
    bookingReference: "BK-83921",
    passengerName: "Juan Dela Cruz",
    flightRoute: "MNL -> LAX",
    seatNumber: "14B",
    bookingStatus: "Confirmed",
    totalPrice: 855.00
  },
  {
    bookingReference: "BK-10495",
    passengerName: "Maria Santos",
    flightRoute: "MNL -> SIN",
    seatNumber: "03A",
    bookingStatus: "Pending",
    totalPrice: 635.00
  },
  {
    bookingReference: "BK-47201",
    passengerName: "Juan Dela Cruz",
    flightRoute: "MNL -> HKG",
    seatNumber: "22E",
    bookingStatus: "Cancelled",
    totalPrice: 110.00
  }
];

// Homepage "at a glance" statistics
const availableFlights =100;
const activeBookings = 10;
const destinations = 5;
