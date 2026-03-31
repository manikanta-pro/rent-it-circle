export const categories = [
  'Photography',
  'Power Tools',
  'Event Gear',
  'Audio',
  'Outdoor',
  'Gaming',
];

export const cityHighlights = [
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Mumbai',
  'Delhi NCR',
];

export const initialItems = [
  {
    id: 'item-1',
    title: 'Sony FX3 Creator Kit',
    category: 'Photography',
    description:
      'Cinema-grade 4K body with cage, dual batteries, 24-70mm lens, shotgun mic, tripod and carry case for shoots that need speed without compromise.',
    condition: 'like-new',
    dailyRate: 3200,
    depositAmount: 15000,
    location: 'Bengaluru',
    image:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=1200&q=80',
    ],
    tags: ['4K video', 'Lens included', 'Instant pickup'],
    ownerId: 'owner-1',
    ownerName: 'Riya Sharma',
    ownerRating: 4.9,
    ownerReviewCount: 89,
    ownerVerified: true,
    ownerLocation: 'Indiranagar, Bengaluru',
    leadTime: 'Pickup in 45 mins',
    availabilityStatus: 'available',
    viewsCount: 412,
  },
  {
    id: 'item-2',
    title: 'Bosch Rotary Hammer Pro Set',
    category: 'Power Tools',
    description:
      'Heavy-duty drill with bit set, safety kit and dust extraction adapter. Ideal for wall mounting, renovation work and weekend builds.',
    condition: 'good',
    dailyRate: 900,
    depositAmount: 5000,
    location: 'Hyderabad',
    image:
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581147036324-c1c7d0a4f0d7?auto=format&fit=crop&w=1200&q=80',
    ],
    tags: ['DIY ready', 'Commercial grade', 'Bit kit'],
    ownerId: 'owner-2',
    ownerName: 'Karthik Reddy',
    ownerRating: 4.7,
    ownerReviewCount: 54,
    ownerVerified: true,
    ownerLocation: 'Madhapur, Hyderabad',
    leadTime: 'Pickup today',
    availabilityStatus: 'available',
    viewsCount: 276,
  },
  {
    id: 'item-3',
    title: 'Portable DJ + Speaker Stack',
    category: 'Audio',
    description:
      'Two powered speakers, compact mixer, wireless mic pair and ambient uplighting for house parties, pop-ups and intimate events.',
    condition: 'like-new',
    dailyRate: 2500,
    depositAmount: 10000,
    location: 'Mumbai',
    image:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
    ],
    tags: ['Events', 'Bluetooth', 'Wireless mic'],
    ownerId: 'owner-3',
    ownerName: 'Naina Kapoor',
    ownerRating: 4.8,
    ownerReviewCount: 67,
    ownerVerified: true,
    ownerLocation: 'Bandra, Mumbai',
    leadTime: 'Delivery available',
    availabilityStatus: 'available',
    viewsCount: 355,
  },
  {
    id: 'item-4',
    title: 'Camping Dome Set for 4',
    category: 'Outdoor',
    description:
      'Weather-sealed tent, foldable chairs, sleeping bags, lantern and cook kit for quick weekend escapes without buying gear you will rarely use.',
    condition: 'good',
    dailyRate: 1100,
    depositAmount: 4200,
    location: 'Pune',
    image:
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523987355523-c7b5b0723c6a?auto=format&fit=crop&w=1200&q=80',
    ],
    tags: ['Weekend trips', 'Cook kit', 'Family size'],
    ownerId: 'owner-4',
    ownerName: 'Dev Patil',
    ownerRating: 4.6,
    ownerReviewCount: 31,
    ownerVerified: false,
    ownerLocation: 'Baner, Pune',
    leadTime: 'Reserve 1 day ahead',
    availabilityStatus: 'available',
    viewsCount: 198,
  },
];

export const initialRentals = [
  {
    id: 'rental-1',
    itemId: 'item-3',
    itemTitle: 'Portable DJ + Speaker Stack',
    ownerId: 'owner-3',
    ownerName: 'Naina Kapoor',
    renterId: 'demo-user',
    renterName: 'Aarav Mehta',
    startDate: '2026-04-04',
    endDate: '2026-04-05',
    days: 1,
    totalAmount: 2500,
    depositAmount: 10000,
    status: 'pending',
    createdAt: '2026-03-28T09:00:00.000Z',
    message: 'Need this setup for a private launch event.',
  },
];

export const trustSignals = [
  { value: '12k+', label: 'Local rentals completed' },
  { value: '4.8/5', label: 'Average host rating' },
  { value: '37%', label: 'Average savings vs buying' },
  { value: '90 mins', label: 'Median same-day pickup window' },
];

export const testimonials = [
  {
    quote:
      'We rented an event lighting setup in under an hour. The entire flow felt polished, trustworthy and genuinely local.',
    author: 'Aditi Rao',
    role: 'Community event organiser',
  },
  {
    quote:
      'Listing my camera kit turned idle gear into monthly income without the friction I expected from a peer-to-peer platform.',
    author: 'Sahil Verma',
    role: 'Freelance cinematographer',
  },
];
