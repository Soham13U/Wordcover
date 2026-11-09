import type { WordPair } from "./types.ts";

export const CATEGORIES = [
  "food",
  "animals",
  "objects",
  "places",
  "jobs",
  "activities",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  food: "Food",
  animals: "Animals",
  objects: "Objects",
  places: "Places",
  jobs: "Jobs",
  activities: "Activities",
};

const pairs: [Category, string, string][] = [
  // ==========================================
  // FOOD (20)
  // ==========================================
  ["food", "Mango", "Peach"],
  ["food", "Sushi", "Sashimi"], //
  ["food", "Bagel", "Doughnut"],
  ["food", "Latte", "Cappuccino"], //
  ["food", "Taco", "Burrito"],
  ["food", "Pancake", "Waffle"],
  ["food", "Hummus", "Guacamole"], //
  ["food", "Ramen", "Pho"],
  ["food", "Brownie", "Cookie"],
  ["food", "Popcorn", "Nachos"],
  ["food", "Omelette", "Scrambled eggs"], //
  ["food", "Chili", "Curry"], //
  ["food", "Pizza", "Flatbread"],
  ["food", "Ice cream", "Frozen yogurt"], //
  ["food", "Burger", "Sandwich"],
  ["food", "Croissant", "Pretzel"], //
  ["food", "Muffin", "Cupcake"], //
  ["food", "Dumpling", "Spring roll"],
  ["food", "Biryani", "Pulao"],
  ["food", "Smoothie", "Milkshake"], //

  // ==========================================
  // ANIMALS (20)
  // ==========================================
  ["animals", "Dolphin", "Shark"],
  ["animals", "Lion", "Tiger"],
  ["animals", "Frog", "Toad"], //
  ["animals", "Rabbit", "Hare"], //
  ["animals", "Crocodile", "Alligator"], //
  ["animals", "Moth", "Butterfly"], //
  ["animals", "Donkey", "Mule"], //
  ["animals", "Seal", "Sea lion"], //
  ["animals", "Parrot", "Toucan"], //
  ["animals", "Turtle", "Tortoise"], //
  ["animals", "Wolf", "Coyote"], //
  ["animals", "Bee", "Wasp"], //
  ["animals", "Penguin", "Puffin"], //
  ["animals", "Owl", "Eagle"],
  ["animals", "Shark", "Orca"],
  ["animals", "Horse", "Zebra"],
  ["animals", "Camel", "Giraffe"],
  ["animals", "Octopus", "Squid"], //
  ["animals", "Cheetah", "Leopard"], //
  ["animals", "Crow", "Raven"], //

  // ==========================================
  // OBJECTS (20)
  // ==========================================
  ["objects", "Sofa", "Armchair"],
  ["objects", "Kettle", "Teapot"], //
  ["objects", "Backpack", "Suitcase"],
  ["objects", "Candle", "Lantern"],
  ["objects", "Hammer", "Mallet"], //
  ["objects", "Blanket", "Quilt"], //
  ["objects", "Mirror", "Window"],
  ["objects", "Pencil", "Crayon"],
  ["objects", "Keyboard", "Typewriter"],
  ["objects", "Umbrella", "Parasol"], //
  ["objects", "Clock", "Watch"],
  ["objects", "Scissors", "Knife"],
  ["objects", "Headphones", "Earbuds"],
  ["objects", "Microscope", "Telescope"],
  ["objects", "Notebook", "Diary"], //
  ["objects", "Flashlight", "Lamp"],
  ["objects", "Bicycle", "Scooter"],
  ["objects", "Elevator", "Escalator"],
  ["objects", "Pillow", "Cushion"], //
  ["objects", "Refrigerator", "Freezer"],

  // ==========================================
  // PLACES (20)
  // ==========================================
  ["places", "Library", "Bookstore"],
  ["places", "Beach", "Lakeshore"], //
  ["places", "Airport", "Train station"],
  ["places", "Museum", "Gallery"], //
  ["places", "Kitchen", "Pantry"], //
  ["places", "Stadium", "Arena"], //
  ["places", "Desert", "Canyon"], //
  ["places", "Harbor", "Marina"], //
  ["places", "Classroom", "Lecture hall"],
  ["places", "Bakery", "Cafe"],
  ["places", "Forest", "Jungle"], //
  ["places", "Attic", "Basement"],
  ["places", "Hospital", "Clinic"],
  ["places", "Hotel", "Resort"], //
  ["places", "Zoo", "Aquarium"],
  ["places", "Castle", "Palace"], //
  ["places", "Gym", "Playground"],
  ["places", "Cinema", "Theater"], //
  ["places", "Supermarket", "Farmers market"], //
  ["places", "Temple", "Monastery"], //

  // ==========================================
  // JOBS (20)
  // ==========================================
  ["jobs", "Chef", "Baker"],
  ["jobs", "Pilot", "Flight attendant"],
  ["jobs", "Detective", "Reporter"],
  ["jobs", "Nurse", "Pharmacist"],
  ["jobs", "Teacher", "Tutor"],
  ["jobs", "Farmer", "Gardener"],
  ["jobs", "Actor", "Director"],
  ["jobs", "Firefighter", "Paramedic"],
  ["jobs", "Judge", "Lawyer"],
  ["jobs", "Mechanic", "Electrician"],
  ["jobs", "Journalist", "Novelist"],
  ["jobs", "Barista", "Bartender"],
  ["jobs", "Architect", "Civil engineer"],
  ["jobs", "Photographer", "Videographer"],
  ["jobs", "Dentist", "Surgeon"],
  ["jobs", "Scientist", "Inventor"],
  ["jobs", "Cashier", "Salesperson"],
  ["jobs", "Librarian", "Archivist"],
  ["jobs", "Police officer", "Security guard"],
  ["jobs", "Programmer", "Hacker"],

  // ==========================================
  // ACTIVITIES (20)
  // ==========================================
  ["activities", "Hiking", "Camping"],
  ["activities", "Swimming", "Diving"],
  ["activities", "Jogging", "Sprinting"],
  ["activities", "Singing", "Rapping"],
  ["activities", "Painting", "Sketching"],
  ["activities", "Reading", "Studying"],
  ["activities", "Cooking", "Baking"],
  ["activities", "Fishing", "Hunting"],
  ["activities", "Surfing", "Skateboarding"],
  ["activities", "Yoga", "Meditation"],
  ["activities", "Cycling", "Running"],
  ["activities", "Dancing", "Gymnastics"],
  ["activities", "Photography", "Filmmaking"],
  ["activities", "Gardening", "Farming"],
  ["activities", "Boxing", "Wrestling"],
  ["activities", "Skiing", "Snowboarding"],
  ["activities", "Shopping", "Browsing"],
  ["activities", "Chess", "Poker"],
  ["activities", "Karaoke", "Concert"],
  ["activities", "Picnic", "Barbecue"],
];

export const BUILTIN_PAIRS: WordPair[] = pairs.map(
  ([category, left, right], index) => ({
    id: `${category}-${index + 1}`,
    category,
    left,
    right,
  }),
);

export function pairsForCategories(categories: string[]): WordPair[] {
  const selected = new Set(categories);
  return BUILTIN_PAIRS.filter((pair) => selected.has(pair.category));
}

export function pickPair(
  pairsToDraw: WordPair[],
  usedIds: string[],
  rng: () => number = Math.random,
): { pair: WordPair; usedIds: string[] } {
  if (pairsToDraw.length === 0) {
    throw new Error("Choose at least one word list that has pairs.");
  }
  const poolIds = new Set(pairsToDraw.map((pair) => pair.id));
  const outside = usedIds.filter((id) => !poolIds.has(id));
  let usedInPool = usedIds.filter((id) => poolIds.has(id));
  let available = pairsToDraw.filter((pair) => !usedInPool.includes(pair.id));
  if (available.length === 0) {
    available = pairsToDraw;
    usedInPool = [];
  }
  const index = Math.min(
    available.length - 1,
    Math.floor(rng() * available.length),
  );
  const pair = available[index];
  if (!pair) throw new Error("Could not draw a word pair.");
  return { pair, usedIds: [...outside, ...usedInPool, pair.id] };
}
