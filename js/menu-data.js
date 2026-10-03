/* ==========================================================================
   YRAL Cafe — Menu Data
   Source: printed YRAL menu board (French Toast, All-Day Breakfast,
   YRAL Sandwiches, Soups, Nachos, YRAL Quesadillas, YRAL Wings, Pastas)
   ========================================================================== */
const YRAL_MENU = [

  /* ---------------- French Toast — ₹369 ---------------- */
  {
    id: "ft-original", name: "Original French Toast", category: "French Toast",
    diet: "veg", price: 369,
    desc: "Thick brioche slices griddled golden, finished with butter, maple syrup, powdered sugar and fresh berries.",
    img: "images/original-french-toast.jpg"
  },
  {
    id: "ft-nutella", name: "Nutella French Toast", category: "French Toast",
    diet: "veg", price: 369,
    desc: "Buttery French toast layered and drizzled with warm Nutella, dusted with sugar and topped with mixed berries.",
    img: "images/nutella-french-toast.jpg"
  },
  {
    id: "ft-banana-pb", name: "Banana & Peanut Butter French Toast", category: "French Toast",
    diet: "veg", price: 369,
    desc: "Caramelised banana, silky peanut butter drizzle and crushed peanuts over golden French toast.",
    img: "images/banana-peanut-butter-french-toast.jpg"
  },

  /* ---------------- All-Day Breakfast — ₹379 ---------------- */
  {
    id: "adb-classic-avocado", name: "Classic Avocado Toast", category: "All-Day Breakfast",
    diet: "veg", price: 379,
    desc: "Smashed avocado on toasted sourdough with shaved radish, micro greens and a citrus chilli drizzle.",
    img: "images/classic-avocado-toast.jpg"
  },
  {
    id: "adb-feta-tomato", name: "Feta Cheese & Cherry Tomato", category: "All-Day Breakfast",
    diet: "veg", price: 379,
    desc: "Roasted cherry tomatoes, cubed feta and basil over avocado on sourdough with a balsamic glaze.",
    img: "images/feta-cherry-tomato.jpg"
  },
  {
    id: "adb-avocado-egg-chilli", name: "Avocado, Egg & Chilli", category: "All-Day Breakfast",
    diet: "nonveg", price: 379,
    desc: "A sunny fried egg over smashed avocado toast, finished with chilli oil, chilli flakes and cracked pepper.",
    img: "images/avocado-egg-chilli.jpg"
  },
  {
    id: "adb-cottage-avocado", name: "Cottage Cheese & Avocado", category: "All-Day Breakfast",
    diet: "veg", price: 379,
    desc: "Fanned avocado slices and whipped cottage cheese over toast, with parsley, chilli flakes and olive oil.",
    img: "images/cottage-cheese-avocado.jpg"
  },
  {
    id: "adb-creamy-chicken", name: "Creamy Chicken with Chilli Garlic", category: "All-Day Breakfast",
    diet: "nonveg", price: 379,
    desc: "Pan-seared chicken bites in a creamy chilli-garlic sauce, piled onto toasted sourdough with fresh herbs.",
    img: "images/creamy-chicken-chilli-garlic.jpg"
  },
  {
    id: "adb-tuna-toast", name: "Tuna Toast", category: "All-Day Breakfast",
    diet: "nonveg", price: 379,
    desc: "Creamy tuna and bell pepper mix piled high on toasted sourdough with cracked pepper and herbs.",
    img: "images/tuna-toast.jpg"
  },

  /* ---------------- YRAL Sandwiches — ₹349 ---------------- */
  {
    id: "sw-veg", name: "Veg Sandwich", category: "YRAL Sandwiches",
    diet: "veg", price: 349,
    desc: "Grilled multigrain bread stacked with crisp lettuce, tomato, cucumber, onion and bell pepper.",
    img: "images/veg-sandwich.jpg"
  },
  {
    id: "sw-triple-cheese", name: "Triple Cheese Sandwich", category: "YRAL Sandwiches",
    diet: "veg", price: 349,
    desc: "Cheddar, mozzarella and a third melting cheese griddled together between golden multigrain bread.",
    img: "images/triple-cheese-sandwich.jpg"
  },
  {
    id: "sw-onion-cheese", name: "Onion & Cheese Sandwich", category: "YRAL Sandwiches",
    diet: "veg", price: 349,
    desc: "Melted cheese, red onion rings, tomato and lettuce pressed between grilled multigrain bread.",
    img: "images/onion-cheese-sandwich.jpg"
  },
  {
    id: "sw-avocado-chicken", name: "Avocado & Chicken Sandwich", category: "YRAL Sandwiches",
    diet: "nonveg", price: 349,
    desc: "Grilled chicken, fanned avocado, tomato, onion and herbed mayo between toasted multigrain bread.",
    img: "images/avocado-chicken-sandwich.jpg"
  },
  {
    id: "sw-chicken-ham-egg", name: "Chicken Ham & Egg Sandwich", category: "YRAL Sandwiches",
    diet: "nonveg", price: 349,
    desc: "Grilled chicken, chicken ham, boiled egg and melted cheddar stacked in toasted multigrain bread.",
    img: "images/chicken-ham-egg-sandwich.jpg"
  },
  {
    id: "sw-peri-peri-chicken", name: "Peri-Peri Chicken Sandwich", category: "YRAL Sandwiches",
    diet: "nonveg", price: 349,
    desc: "Peri-peri glazed chicken, melted cheese, lettuce, tomato and onion in a smoky peri-peri mayo.",
    img: "images/peri-peri-chicken-sandwich.jpg"
  },
  {
    id: "sw-tuna", name: "Tuna Sandwich", category: "YRAL Sandwiches",
    diet: "nonveg", price: 349,
    desc: "Classic tuna salad with red onion, lettuce and cucumber, pressed between toasted multigrain bread.",
    img: "images/tuna-sandwich.jpg"
  },

  /* ---------------- Soups — ₹359 (Lamb ₹379, Marag priced separately) ---------------- */
  {
    id: "sp-potato-leek", name: "Potato & Leek Soup", category: "Soups",
    diet: "veg", price: 359,
    desc: "A velvety potato and leek base finished with cream, olive oil, parsley and cracked pepper.",
    img: "images/potato-leek-soup.jpg"
  },
  {
    id: "sp-cream-mushroom", name: "Cream of Mushroom Soup", category: "Soups",
    diet: "veg", price: 359,
    desc: "Slow-simmered mushroom cream soup topped with sautéed mushroom slices and fresh parsley.",
    img: "images/cream-mushroom-soup.jpg"
  },
  {
    id: "sp-cream-broccoli", name: "Cream of Broccoli Soup", category: "Soups",
    diet: "veg", price: 359,
    desc: "A bright, silky broccoli purée finished with cream, olive oil and toasted florets.",
    img: "images/cream-broccoli-soup.jpg"
  },
  {
    id: "sp-corn-spinach", name: "Corn & Spinach Soup", category: "Soups",
    diet: "veg", price: 359,
    desc: "Sweetcorn kernels and baby spinach simmered in a light, comforting golden broth.",
    img: "images/corn-spinach-soup.jpg"
  },
  {
    id: "sp-lamb-bone", name: "Spicy Lamb Bone Soup", category: "Soups",
    diet: "nonveg", price: 379,
    desc: "A robust, slow-cooked lamb bone broth with vegetables, chilli and herbs — deeply spiced and hearty.",
    img: "images/spicy-lamb-bone-soup.jpg"
  },
  {
    id: "sp-marag-veg", name: "Mutton Marag (Veg)", category: "Soups",
    diet: "veg", price: 259,
    desc: "Our signature Hyderabadi marag reimagined vegetarian — a rich, peppery slow-cooked broth with herbs.",
    img: "images/mutton-marag.jpg"
  },
  {
    id: "sp-marag-nonveg", name: "Mutton Marag (Non-Veg)", category: "Soups",
    diet: "nonveg", price: 279,
    desc: "Traditional Hyderabadi mutton bone marag — a rich, peppery slow-cooked broth with tender mutton pieces.",
    img: "images/mutton-marag.jpg"
  },

  /* ---------------- Nachos ---------------- */
  {
    id: "na-veg-picadillo", name: "Veg Picadillo Nachos", category: "Nachos",
    diet: "veg", price: 329,
    desc: "Crisp nachos loaded with vegetable picadillo, melted cheese, jalapeños, salsa and sour cream.",
    img: "images/veg-picadillo-nachos.jpg"
  },
  {
    id: "na-chicken-picadillo", name: "Chicken Picadillo Nachos", category: "Nachos",
    diet: "nonveg", price: 369,
    desc: "Loaded nachos topped with spiced chicken picadillo, melted cheese, jalapeños, salsa and sour cream.",
    img: "images/chicken-picadillo-nachos.jpg"
  },

  /* ---------------- YRAL Quesadillas ---------------- */
  {
    id: "qd-mushroom-onion", name: "Mushroom & Onion Quesadilla", category: "YRAL Quesadillas",
    diet: "veg", price: 329,
    desc: "Griddled tortilla folded over sautéed mushrooms, caramelised onion and melted cheese, served with salsa.",
    img: "images/mushroom-onion-quesadilla.jpg"
  },
  {
    id: "qd-mexican-bean", name: "Mexican Bean & Cheese Quesadilla", category: "YRAL Quesadillas",
    diet: "veg", price: 329,
    desc: "Black beans, bell pepper and melted cheese folded in a crisp tortilla, served with sour cream.",
    img: "images/mexican-bean-cheese-quesadilla.jpg"
  },
  {
    id: "qd-mexican-chicken", name: "Mexican Chicken Quesadilla", category: "YRAL Quesadillas",
    diet: "nonveg", price: 369,
    desc: "Spiced grilled chicken, peppers, corn and melted cheese folded into a crisp griddled tortilla.",
    img: "images/mexican-chicken-quesadilla.jpg"
  },
  {
    id: "qd-chicken-fajita", name: "Chicken Fajita Quesadilla", category: "YRAL Quesadillas",
    diet: "nonveg", price: 369,
    desc: "Fajita-spiced chicken with charred peppers and onions, melted cheese, folded and griddled crisp.",
    img: "images/chicken-fajita-quesadilla.jpg"
  },
  {
    id: "qd-chicken-keema", name: "Chicken Keema & Cheese Quesadilla", category: "YRAL Quesadillas",
    diet: "nonveg", price: 369,
    desc: "Spiced chicken keema, bell peppers and melting cheese folded into a crisp griddled tortilla.",
    img: "images/chicken-keema-cheese-quesadilla.jpg"
  },

  /* ---------------- YRAL Wings — ₹299 ---------------- */
  {
    id: "wg-crispy-fried", name: "Crispy Fried Wings", category: "YRAL Wings",
    diet: "nonveg", price: 299,
    desc: "Double-fried chicken wings with a crackling, spiced crust — served hot with a chilli-lime dust.",
    img: "images/crispy-fried-wings.jpg"
  },
  {
    id: "wg-baked-bbq", name: "Baked BBQ Wings", category: "YRAL Wings",
    diet: "nonveg", price: 299,
    desc: "Oven-baked wings glazed in a smoky, sticky BBQ sauce with charred edges and fresh herbs.",
    img: "images/baked-bbq-wings.jpg"
  },
  {
    id: "wg-baked-buffalo", name: "Baked Buffalo Wings", category: "YRAL Wings",
    diet: "nonveg", price: 299,
    desc: "Classic buffalo-style baked wings, tossed in a tangy, buttery hot sauce with fresh parsley.",
    img: "images/baked-buffalo-wings.jpg"
  },
  {
    id: "wg-baked-korean", name: "Baked Spicy Korean Wings", category: "YRAL Wings",
    diet: "nonveg", price: 299,
    desc: "Sticky gochujang-glazed wings finished with sesame seeds and chilli flakes — sweet, spicy, umami.",
    img: "images/baked-spicy-korean-wings.jpg"
  },
  {
    id: "wg-peri-peri", name: "Peri-Peri Wings", category: "YRAL Wings",
    diet: "nonveg", price: 299,
    desc: "Char-grilled wings basted in a fiery peri-peri sauce, finished with fresh chilli and herbs.",
    img: "images/peri-peri-wings.jpg"
  },

  /* ---------------- Pastas — ₹449 ---------------- */
  {
    id: "ps-arrabbiata", name: "Arrabbiata Pasta", category: "Pastas",
    diet: "veg", price: 449,
    desc: "Penne tossed in a fiery tomato-chilli sauce with garlic, basil and shaved parmesan.",
    img: "images/arrabbiata-pasta.jpg"
  },
  {
    id: "ps-penne-alfredo-marinara", name: "Penne Pasta — Alfredo / Marinara", category: "Pastas",
    diet: "veg", price: 449,
    desc: "Penne in your choice of silky Alfredo cream sauce or classic marinara, finished with parmesan and basil.",
    img: "images/penne-pasta-alfredo-marinara.jpg"
  },
  {
    id: "ps-asian-stir-fried", name: "Asian-Style Stir-Fried Spaghetti", category: "Pastas",
    diet: "veg", price: 449,
    desc: "Wok-tossed spaghetti with broccoli, peppers and scallion in a savoury soy-chilli glaze, topped with sesame.",
    img: "images/asian-style-stir-fried-spaghetti.jpg"
  }
];

const YRAL_CATEGORIES = [
  "All",
  "French Toast",
  "All-Day Breakfast",
  "YRAL Sandwiches",
  "Soups",
  "Nachos",
  "YRAL Quesadillas",
  "YRAL Wings",
  "Pastas"
];

/* Gallery: building + a curated set of dishes */
const YRAL_GALLERY = [
  { img: "images/yral-storefront.jpg", cap: "YRAL Cafe — wood & glass façade", big: true },
  { img: "images/mutton-marag.jpg", cap: "Mutton Marag" },
  { img: "images/classic-avocado-toast.jpg", cap: "Classic Avocado Toast" },
  { img: "images/baked-spicy-korean-wings.jpg", cap: "Baked Spicy Korean Wings", wide: true },
  { img: "images/penne-pasta-alfredo-marinara.jpg", cap: "Penne Pasta — Alfredo / Marinara" },
  { img: "images/chicken-fajita-quesadilla.jpg", cap: "Chicken Fajita Quesadilla" },
  { img: "images/nutella-french-toast.jpg", cap: "Nutella French Toast" },
  { img: "images/cream-broccoli-soup.jpg", cap: "Cream of Broccoli Soup" },
  { img: "images/peri-peri-chicken-sandwich.jpg", cap: "Peri-Peri Chicken Sandwich", wide: true },
  { img: "images/chicken-picadillo-nachos.jpg", cap: "Chicken Picadillo Nachos" }
];
