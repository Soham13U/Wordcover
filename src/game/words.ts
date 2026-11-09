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
  ["food", "Sushi", "Tempura"],
  ["food", "Bagel", "Doughnut"],
  ["food", "Latte", "Espresso"],
  ["food", "Taco", "Burrito"],
  ["food", "Pancake", "Waffle"],
  ["food", "Hummus", "Salsa"],
  ["food", "Ramen", "Pho"],
  ["food", "Brownie", "Cookie"],
  ["food", "Popcorn", "Nachos"],
  ["food", "Curry", "Tandoori"],
  ["food", "Pizza", "Flatbread"],
  ["food", "Ice cream", "Sorbet"],
  ["food", "Burger", "Sandwich"],
  ["food", "Croissant", "Baguette"],
  ["food", "Dumpling", "Spring roll"],
  ["food", "Biryani", "Pulao"],
  ["food", "Smoothie", "Juice"],

  // ==========================================
  // ANIMALS (20)
  // ==========================================
  ["animals", "Dolphin", "Shark"],
  ["animals", "Lion", "Tiger"],
  ["animals", "Frog", "Salamander"],
  ["animals", "Rabbit", "Squirrel"],
  ["animals", "Crocodile", "Snake"],
  ["animals", "Butterfly", "Dragonfly"],
  ["animals", "Donkey", "Goat"],
  ["animals", "Parrot", "Flamingo"],
  ["animals", "Turtle", "Crab"],
  ["animals", "Wolf", "Fox"],
  ["animals", "Bee", "Ant"],
  ["animals", "Penguin", "Ostrich"],
  ["animals", "Owl", "Eagle"],
  ["animals", "Shark", "Orca"],
  ["animals", "Horse", "Zebra"],
  ["animals", "Camel", "Giraffe"],
  ["animals", "Octopus", "Jellyfish"],
  ["animals", "Cheetah", "Hyena"],
  ["animals", "Crow", "Vulture"],

  // ==========================================
  // OBJECTS (20)
  // ==========================================
  ["objects", "Sofa", "Armchair"],
  ["objects", "Kettle", "Thermos"],
  ["objects", "Backpack", "Suitcase"],
  ["objects", "Candle", "Lantern"],
  ["objects", "Hammer", "Screwdriver"],
  ["objects", "Blanket", "Sleeping bag"],
  ["objects", "Mirror", "Window"],
  ["objects", "Pencil", "Crayon"],
  ["objects", "Keyboard", "Typewriter"],
  ["objects", "Umbrella", "Raincoat"],
  ["objects", "Clock", "Watch"],
  ["objects", "Scissors", "Knife"],
  ["objects", "Headphones", "Earbuds"],
  ["objects", "Microscope", "Telescope"],
  ["objects", "Notebook", "Textbook"],
  ["objects", "Flashlight", "Lamp"],
  ["objects", "Bicycle", "Scooter"],
  ["objects", "Elevator", "Escalator"],
  ["objects", "Pillow", "Mattress"],
  ["objects", "Refrigerator", "Freezer"],

  // ==========================================
  // PLACES (20)
  // ==========================================
  ["places", "Library", "Bookstore"],
  ["places", "Beach", "Pool"],
  ["places", "Airport", "Train station"],
  ["places", "Museum", "Monument"],
  ["places", "Kitchen", "Dining room"],
  ["places", "Stadium", "Racetrack"],
  ["places", "Desert", "Tundra"],
  ["places", "Harbor", "Lighthouse"],
  ["places", "Classroom", "Lecture hall"],
  ["places", "Bakery", "Cafe"],
  ["places", "Forest", "Savanna"],
  ["places", "Attic", "Basement"],
  ["places", "Hospital", "Clinic"],
  ["places", "Hotel", "Hostel"],
  ["places", "Zoo", "Aquarium"],
  ["places", "Castle", "Mansion"],
  ["places", "Gym", "Playground"],
  ["places", "Supermarket", "Mall"],
  ["places", "Temple", "Church"],

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
  ["jobs", "Dentist", "Surgeon"],
  ["jobs", "Scientist", "Astronaut"],
  ["jobs", "Cashier", "Salesperson"],
  ["jobs", "Librarian", "Bookseller"],
  ["jobs", "Police officer", "Soldier"],
  ["jobs", "Programmer", "Hacker"],

  // ==========================================
  // ACTIVITIES (20)
  // ==========================================
  ["activities", "Hiking", "Camping"],
  ["activities", "Swimming", "Kayaking"],
  ["activities", "Jogging", "Rowing"],
  ["activities", "Singing", "Rapping"],
  ["activities", "Painting", "Sculpting"],
  ["activities", "Reading", "Studying"],
  ["activities", "Cooking", "Baking"],
  ["activities", "Fishing", "Hunting"],
  ["activities", "Surfing", "Skateboarding"],
  ["activities", "Cycling", "Running"],
  ["activities", "Dancing", "Gymnastics"],
  ["activities", "Photography", "Filmmaking"],
  ["activities", "Gardening", "Farming"],
  ["activities", "Boxing", "Wrestling"],
  ["activities", "Skiing", "Snowboarding"],
  ["activities", "Chess", "Poker"],
  ["activities", "Karaoke", "Concert"],
  ["activities", "Picnic", "Potluck"],
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
