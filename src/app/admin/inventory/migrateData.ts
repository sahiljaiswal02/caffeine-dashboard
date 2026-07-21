const standardAddons = [
  { id: "a1", name: "Extra Cheese", price: 20 },
  { id: "a2", name: "Extra Sauce", price: 10 },
  { id: "a3", name: "Extra Meat", price: 40 },
];
const breadOptions = ["Khuboos", "Brota", "Parota"];

const rawMigrateData = [
  {
    id: "item1",
    name: "Regular Chicken Shawarma",
    description: "Classic chicken shawarma with fresh veggies and signature sauces. Served with your choice of Khuboos, Brota, or Parota bread.",
    price: 100,
    image: "local_item1",
    categoryId: "cat1",
    rating: 4.7,
    isFeatured: true,
    ingredients: ["Chicken", "Veggies", "Sauces", "Khuboos/Brota/Parota"],
    preparationTime: 10,
    isAvailable: true
  },
  {
    id: "item2",
    name: "Regular Chicken Cheese Plate",
    description: "Delicious chicken shawarma platter loaded with melted cheese.",
    price: 170,
    image: "local_item2",
    categoryId: "cat1",
    rating: 4.8,
    isFeatured: true,
    ingredients: ["Chicken", "Cheese", "Veggies", "Sauces", "Khuboos/Brota/Parota"],
    preparationTime: 12,
    isAvailable: true
  },
  {
    id: "item3",
    name: "Egg Chicken Shawarma",
    description: "Chicken shawarma enhanced with egg for an extra protein boost.",
    price: 170,
    image: "local_item3",
    categoryId: "cat1",
    rating: 4.6,
    ingredients: ["Chicken", "Egg", "Veggies", "Sauces"],
    preparationTime: 12,
    isAvailable: true
  },
  {
    id: "item4",
    name: "Barbeque Chicken Shawarma",
    description: "Smoky barbeque flavoured chicken shawarma with tangy BBQ sauce.",
    price: 120,
    image: "local_item4",
    categoryId: "cat1",
    rating: 4.7,
    ingredients: ["Chicken", "BBQ Sauce", "Veggies"],
    preparationTime: 12,
    isAvailable: true
  },
  {
    id: "item5",
    name: "Full Meat Chicken Shawarma",
    description: "Loaded with generous portions of juicy chicken meat.",
    price: 180,
    image: "local_item5",
    categoryId: "cat1",
    rating: 4.9,
    isFeatured: true,
    ingredients: ["Extra Chicken", "Sauces", "Veggies"],
    preparationTime: 15,
    isAvailable: true
  },
  {
    id: "item6",
    name: "Full Meat Plate",
    description: "A hearty plate of full meat chicken shawarma served on a platter.",
    price: 220,
    image: "local_item6",
    categoryId: "cat1",
    rating: 4.8,
    ingredients: ["Extra Chicken", "Sauces", "Veggies", "Sides"],
    preparationTime: 15,
    isAvailable: true
  },
  {
    id: "item7",
    name: "Peri Peri Chicken Shawarma",
    description: "Fiery peri peri spiced chicken shawarma for spice lovers.",
    price: 120,
    image: "local_item7",
    categoryId: "cat1",
    rating: 4.6,
    ingredients: ["Chicken", "Peri Peri Sauce", "Veggies"],
    preparationTime: 12,
    isAvailable: true
  },
  {
    id: "item8",
    name: "Peri Peri Chicken Plate",
    description: "Peri peri flavoured chicken shawarma served as a full plate.",
    price: 190,
    image: "local_item8",
    categoryId: "cat1",
    rating: 4.7,
    ingredients: ["Chicken", "Peri Peri Sauce", "Veggies", "Sides"],
    preparationTime: 15,
    isAvailable: true
  },
  {
    id: "item9",
    name: "Schezwan Chicken Shawarma",
    description: "Indo-Chinese fusion — chicken shawarma with spicy schezwan sauce.",
    price: 130,
    image: "local_item9",
    categoryId: "cat2",
    rating: 4.5,
    ingredients: ["Chicken", "Schezwan Sauce", "Veggies"],
    preparationTime: 12,
    isAvailable: true
  },
  {
    id: "item10",
    name: "Schezwan Cheese Chicken Shawarma",
    description: "Schezwan spiced chicken shawarma loaded with melted cheese.",
    price: 130,
    image: "local_item10",
    categoryId: "cat2",
    rating: 4.6,
    isFeatured: true,
    ingredients: ["Chicken", "Schezwan Sauce", "Cheese", "Veggies"],
    preparationTime: 12,
    isAvailable: true
  },
  {
    id: "item11",
    name: "Egg Roll",
    description: "Classic egg roll with perfectly cooked egg, fresh veggies and sauces.",
    price: 70,
    image: "local_item11",
    categoryId: "cat3",
    rating: 4.3,
    ingredients: ["Egg", "Veggies", "Sauces", "Roll"],
    preparationTime: 8,
    isAvailable: true
  },
  {
    id: "item12",
    name: "Double Egg Roll",
    description: "Double the egg, double the satisfaction!",
    price: 100,
    image: "local_item12",
    categoryId: "cat3",
    rating: 4.4,
    ingredients: ["Double Egg", "Veggies", "Sauces", "Roll"],
    preparationTime: 10,
    isAvailable: true
  },
  {
    id: "item13",
    name: "Paneer Roll",
    description: "Soft and flavourful paneer roll with marinated paneer, fresh veggies and sauces.",
    price: 90,
    image: "local_item13",
    categoryId: "cat4",
    rating: 4.5,
    ingredients: ["Paneer", "Veggies", "Sauces"],
    preparationTime: 10,
    isAvailable: true
  },
  {
    id: "item14",
    name: "Cheese Paneer Roll",
    description: "Paneer roll topped with generous melted cheese for a cheesy delight.",
    price: 99,
    image: "local_item14",
    categoryId: "cat4",
    rating: 4.6,
    isFeatured: true,
    ingredients: ["Paneer", "Cheese", "Veggies", "Sauces"],
    preparationTime: 10,
    isAvailable: true
  },
  {
    id: "item15",
    name: "Peri Peri Paneer Roll",
    description: "Paneer roll with a kick of peri peri spice.",
    price: 110,
    image: "local_item15",
    categoryId: "cat4",
    rating: 4.5,
    ingredients: ["Paneer", "Peri Peri Sauce", "Veggies"],
    preparationTime: 10,
    isAvailable: true
  },
  {
    id: "item16",
    name: "Mutton Shawarma",
    description: "Tender mutton shawarma slow-cooked with aromatic spices.",
    price: 170,
    image: "local_item16",
    categoryId: "cat5",
    rating: 4.8,
    isFeatured: true,
    ingredients: ["Mutton", "Spices", "Veggies", "Sauces"],
    preparationTime: 18,
    isAvailable: true
  },
  {
    id: "item17",
    name: "Full Mutton Shawarma",
    description: "Extra loaded mutton shawarma with generous portions of succulent mutton.",
    price: 220,
    image: "local_item17",
    categoryId: "cat5",
    rating: 4.9,
    ingredients: ["Extra Mutton", "Spices", "Veggies", "Sauces"],
    preparationTime: 20,
    isAvailable: true
  },
  {
    id: "item18",
    name: "Cold Drinks",
    description: "Chilled carbonated beverages to complement your meal. Price at MRP.",
    price: 40,
    image: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?q=80&w=1974&auto=format&fit=crop",
    categoryId: "cat6",
    rating: 4.2,
    ingredients: ["Carbonated Beverage"],
    preparationTime: 2,
    isAvailable: true
  },
  {
    id: "item19",
    name: "Mojitos",
    description: "Refreshing mint-infused mojito to cool you down. Price at MRP.",
    price: 60,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1974&auto=format&fit=crop",
    categoryId: "cat6",
    rating: 4.5,
    ingredients: ["Mint", "Lime", "Soda", "Sugar"],
    preparationTime: 5,
    isAvailable: true
  },
  {
    id: "item20",
    name: "Fresh Lime",
    description: "Freshly squeezed lime juice — sweet, salty, or soda. A perfect thirst quencher.",
    price: 30,
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?q=80&w=1974&auto=format&fit=crop",
    categoryId: "cat6",
    rating: 4.3,
    ingredients: ["Lime", "Water", "Sugar/Salt"],
    preparationTime: 3,
    isAvailable: true
  },
  {
    id: "item21",
    name: "Mineral Water",
    description: "Pure mineral water to stay hydrated.",
    price: 20,
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=1888&auto=format&fit=crop",
    categoryId: "cat6",
    rating: 4.0,
    ingredients: ["Mineral Water"],
    preparationTime: 1,
    isAvailable: true
  },
];

export const migrateData = rawMigrateData.map(item => {
  const isRoll = item.name.toLowerCase().includes("roll");
  const isBeverage = item.categoryId === "cat6";
  const isAddonCat = item.categoryId === "cat7";
  
  let breadChoices = undefined;
  if (!isRoll && !isBeverage && !isAddonCat) {
    breadChoices = breadOptions;
  }
  
  let availableAddons = undefined;
  if (!isBeverage && !isAddonCat) {
    availableAddons = standardAddons;
  }

  const calories = item.name.includes("Cheese") ? 450 : item.name.includes("Mutton") ? 550 : item.name.includes("Roll") ? 320 : 380;
  const proteins = item.name.includes("Chicken") ? 28 : item.name.includes("Mutton") ? 32 : item.name.includes("Egg") ? 18 : item.name.includes("Paneer") ? 15 : 5;
  const carbs = item.name.includes("Roll") ? 45 : 35;

  return {
    ...item,
    ...(!isBeverage && !isAddonCat ? { calories, proteins, carbs } : {}),
    ...(breadChoices ? { breadChoices } : {}),
    ...(availableAddons ? { availableAddons } : {})
  };
});
