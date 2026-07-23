export const imageMap: Record<string, string> = {
  "local_item1": "/images/menu/regular_shawrma.webp",
  "local_item2": "/images/menu/regular_chicken_cheese_shawrma.webp",
  "local_item3": "/images/menu/egg_chicken_shawrma.webp",
  "local_item4": "/images/menu/barbeque_chicken_shawrma.webp",
  "local_item5": "/images/menu/full_meat_chicken_shawrma.webp",
  "local_item6": "/images/menu/full_meat_plate.webp",
  "local_item7": "/images/menu/peri_peri_chicken_shawrma.webp",
  "local_item8": "/images/menu/peri_peri_chicken_plate.webp",
  "local_item9": "/images/menu/schewan_chicken_shawrma.webp",
  "local_item10": "/images/menu/schewan_chicken_cheese_shawrma.webp",
  "local_item11": "/images/menu/egg_roll.webp",
  "local_item12": "/images/menu/double_egg_roll.webp",
  "local_item13": "/images/menu/paneer_roll.webp",
  "local_item14": "/images/menu/cheese_paneer_roll.webp",
  "local_item15": "/images/menu/peri_peri_panner_roll.webp",
  "local_item16": "/images/menu/mutton_shawrma.webp",
  "local_item17": "/images/menu/ful_mutton_shawrma.webp",
  "local_item18": "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?q=80&w=1974&auto=format&fit=crop",
  "local_item19": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1974&auto=format&fit=crop",
  "local_item20": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?q=80&w=1974&auto=format&fit=crop",
  "local_item21": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=1888&auto=format&fit=crop"
};

export const getImageUrl = (imageField: string) => {
  if (!imageField) return null;
  if (imageField.startsWith("local_")) {
    return imageMap[imageField] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1760&auto=format&fit=crop";
  }
  return imageField;
};
