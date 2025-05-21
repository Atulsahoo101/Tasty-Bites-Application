// uploadMenu.js
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebaseConfig.js";

const menuItems = [
  {
    "id": "1",
    "name": "Pakhala Bhata",
    "description": "Fermented rice soaked in water and curd, served with fried fish and roasted vegetables",
    "price": 720,
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Pakhala_01.jpg/1200px-Pakhala_01.jpg",
    "category": "Rice Dishes",
    "taste": "mild",
    "servings": 2,
    "diet": "non-veg"
  },
  {
    "id": "2",
    "name": "Dalma",
    "description": "Lentil stew with mixed vegetables like pumpkin, raw banana, and papaya, tempered with panch phoran",
    "price": 600,
    "imageUrl": "https://www.seema.com/wp-content/uploads/2022/04/Dalma-recipe.jpg",
    "category": "Vegetable Curries",
    "taste": "mild",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "3",
    "name": "Machha Besara",
    "description": "Rohu fish curry cooked in a tangy mustard paste with spices and grated coconut",
    "price": 1000,
    "imageUrl": "https://img-global.cpcdn.com/recipes/443ca45cbe3805ff/1200x630cq70/photo.jpg",
    "category": "Seafood",
    "taste": "spicy",
    "servings": 2,
    "diet": "non-veg"
  },
  {
    "id": "4",
    "name": "Chhena Poda",
    "description": "Caramelized cottage cheese dessert baked with sugar, cardamom, and nuts",
    "price": 520,
    "imageUrl": "https://gayathriscookspot.com/wp-content/uploads/2012/04/Chenna-Poda-6-500x500.jpg",
    "category": "Desserts",
    "taste": "sweet",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "5",
    "name": "Santula",
    "description": "Light vegetable curry with raw papaya, brinjal, and potato, tempered with minimal spices",
    "price": 640,
    "imageUrl": "https://realfood.tesco.com/media/images/1400x919-OrissanSantula-f1f835f4-bfc1-4897-8c9a-770f2a30db53-0-1400x919.jpg",
    "category": "Vegetable Curries",
    "taste": "mild",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "6",
    "name": "Kanika",
    "description": "Sweet pulao with rice, ghee, raisins, cashews, and aromatic spices",
    "price": 760,
    "imageUrl": "https://img-global.cpcdn.com/recipes/54c1229fcb84c1f6/680x482cq70/kanika-pulao-odia-kanika-puri-kanika-recipe-main-photo.jpg",
    "category": "Rice Dishes",
    "taste": "sweet",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "7",
    "name": "Chungdi Malai",
    "description": "Prawns cooked in a creamy coconut milk gravy with mild spices",
    "price": 1200,
    "imageUrl": "https://static.toiimg.com/thumb/54439535.cms?imgsize=161358&width=800&height=800",
    "category": "Seafood",
    "taste": "mild",
    "servings": 2,
    "diet": "non-veg"
  },
  {
    "id": "8",
    "name": "Rasabali",
    "description": "Fried chhena patties soaked in thickened sweet milk with cardamom",
    "price": 480,
    "imageUrl": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhEiNIki7zbN36pCp4dmu295b8VwXkfphks4L9nMz1M2_Lr03siaRKUZHuyIbru0Glq1PQ2wCaLyYejsulFqKX_hYQzTnR_5FzjU7QGG-x9BbTonjX329Jcqw15HSEiay69P88faT7eCdIp/s1600/01+-+Copy.jpg",
    "category": "Desserts",
    "taste": "sweet",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "9",
    "name": "Dahi Baigana",
    "description": "Fried eggplant in a spiced yogurt curry, garnished with curry leaves",
    "price": 560,
    "imageUrl": "https://www.blissofcooking.com/wp-content/uploads/2021/03/Dahi-Baigana-EOP.jpg?v=1616675464",
    "category": "Vegetable Curries",
    "taste": "mild",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "10",
    "name": "Badi Chura",
    "description": "Crushed sun-dried lentil dumplings mixed with onions, chilies, and mustard oil",
    "price": 400,
    "imageUrl": "https://www.archanaskitchen.com/images/archanaskitchen/1-Author/Sasmita/oriya-badi-chura-recipe-sundried-lentil-dumpling-crumble.jpg",
    "category": "Snacks",
    "taste": "spicy",
    "servings": 1,
    "diet": "veg"
  },
  {
    "id": "11",
    "name": "Chhencheda",
    "description": "Fish head curry cooked with vegetables and spices, a coastal delicacy",
    "price": 960,
    "imageUrl": "https://img-global.cpcdn.com/recipes/c94a721e4d1e855a/680x482cq70/chhena-poda-the-traditional-deserts-of-odisha-recipe-main-photo.jpg",
    "category": "Seafood",
    "taste": "spicy",
    "servings": 2,
    "diet": "non-veg"
  },
  {
    "id": "12",
    "name": "Pithau Bhaja",
    "description": "Crispy fried rice flour pancakes, often served with chutney or curry",
    "price": 360,
    "imageUrl": "https://d3aew4oo17ml6.cloudfront.net/images/photos/thumbnailfull/photos-2014-12-19-6-5-44.jpg?v=1.1.0",
    "category": "Snacks",
    "taste": "mild",
    "servings": 1,
    "diet": "veg"
  },
  {
    "id": "13",
    "name": "Mansha Tarkari",
    "description": "Mutton curry with potatoes in a rich, spicy gravy",
    "price": 1120,
    "imageUrl": "https://images.slurrp.com/prod/articles/ntj6s81mefo.webp",
    "category": "Meat Dishes",
    "taste": "spicy",
    "servings": 2,
    "diet": "non-veg"
  },
  {
    "id": "14",
    "name": "Chhena Jhili",
    "description": "Deep-fried chhena dumplings soaked in sugar syrup",
    "price": 440,
    "imageUrl": "https://4.imimg.com/data4/HT/YI/ANDROID-72259289/product-500x500.jpeg",
    "category": "Desserts",
    "taste": "sweet",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "15",
    "name": "Oou Khatta",
    "description": "Sweet-tangy chutney made from elephant apple with jaggery and spices",
    "price": 320,
    "imageUrl": "https://thecookingjoy.wordpress.com/wp-content/uploads/2018/10/20181029_2025213902175724640623988.jpg",
    "category": "Snacks",
    "taste": "tangy",
    "servings": 1,
    "diet": "veg"
  },
  {
    "id": "16",
    "name": "Mudhi Ghanta",
    "description": "Puffed rice mixed with vegetables, spices, and peanuts",
    "price": 480,
    "imageUrl": "https://i.ytimg.com/vi/fXJWvz0SqRI/maxresdefault.jpg",
    "category": "Snacks",
    "taste": "spicy",
    "servings": 1,
    "diet": "veg"
  },
  {
    "id": "17",
    "name": "Kakara Pitha",
    "description": "Deep-fried semolina dumplings stuffed with sweet coconut filling",
    "price": 440,
    "imageUrl": "https://foodtrails25.com/wp-content/uploads/2021/06/Sooji-Kakara-Pitha.jpg",
    "category": "Desserts",
    "taste": "sweet",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "18",
    "name": "Khechudi",
    "description": "Rice and lentil dish cooked with ghee and mild spices, often served with curry",
    "price": 680,
    "imageUrl": "https://holycowvegan.net/wp-content/uploads/2014/06/masala-khichdi-featured-image.jpg",
    "category": "Rice Dishes",
    "taste": "mild",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "19",
    "name": "Biri Aloo Bhaja",
    "description": "Spicy stir-fried potatoes with black gram dumplings",
    "price": 520,
    "imageUrl": "https://gharkazyka.com/wp-content/uploads/2024/10/IMG_20241006_222907.jpg",
    "category": "Vegetable Curries",
    "taste": "spicy",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "20",
    "name": "Chingudi Jhola",
    "description": "Prawn curry with a spicy tomato and onion gravy",
    "price": 1160,
    "imageUrl": "https://img-global.cpcdn.com/recipes/20fff84563627873/680x482cq70/prawn-curry-odia-style-recipe-main-photo.jpg",
    "category": "Seafood",
    "taste": "spicy",
    "servings": 2,
    "diet": "non-veg"
  },
  {
    "id": "21",
    "name": "Arisa Pitha",
    "description": "Deep-fried rice flour cakes made with jaggery and sesame seeds",
    "price": 480,
    "imageUrl": "https://scontent.fccu20-1.fna.fbcdn.net/v/t1.6435-9/104045993_141421340854590_4967258394039876939_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=o3iih0JRIi0Q7kNvwHnYs5-&_nc_oc=Adl4gjmP5H38AFemmMmSl1P09SjBGN1XpkIWcI9bN4iYLV570O88kQk10Kz297UrkJ3g2F_UcYoXp_jKlv5HFsI3&_nc_zt=23&_nc_ht=scontent.fccu20-1.fna&_nc_gid=u5FDizfWsK0TUBgr1o-rUQ&oh=00_AfInTyBxZoPiKZ8oLOGAzykzjFFJ2SC7S9bupeQyHqeTWw&oe=685419AB",
    "category": "Desserts",
    "taste": "sweet",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "22",
    "name": "Sajana Chhuin Tarkari",
    "description": "Drumstick curry with potatoes and mild spices",
    "price": 600,
    "imageUrl": "https://i.ytimg.com/vi/y1ebJhKng94/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD8nLl6W0b2ELkCLSa-qEpMHACwbg",
    "category": "Vegetable Curries",
    "taste": "mild",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "23",
    "name": "Kancha Kadali Bhaja",
    "description": "Crispy fried raw banana slices with spices",
    "price": 440,
    "imageUrl": "https://i.ytimg.com/vi/Tw-ipm32iTE/hqdefault.jpg",
    "category": "Vegetable Curries",
    "taste": "spicy",
    "servings": 2,
    "diet": "veg"
  },
  {
    "id": "24",
    "name": "Dahi Machha",
    "description": "Fish cooked in a creamy yogurt-based curry with mild spices",
    "price": 1040,
    "imageUrl": "https://img-global.cpcdn.com/recipes/8f3534f3a64c4bbb/400x400cq70/photo.jpg",
    "category": "Seafood",
    "taste": "mild",
    "servings": 2,
    "diet": "non-veg"
  },
  {
    "id": "25",
    "name": "Podo Pitha",
    "description": "Baked rice cake with coconut, jaggery, and lentils",
    "price": 520,
    "imageUrl": "https://pencilforchange.in/wp-content/uploads/2023/08/Poda-pitha-photo-11.jpeg",
    "category": "Desserts",
    "taste": "sweet",
    "servings": 2,
    "diet": "veg"
  }
]
;

const uploadMenu = async () => {
  const menuCollection = collection(db, "menu");

  for (const item of menuItems) {
    try {
      await addDoc(menuCollection, item);
      console.log(`Uploaded: ${item.name}`);
    } catch (error) {
      console.error(`Error uploading ${item.name}:`, error);
    }
  }

  console.log("All menu items uploaded successfully.");
};

uploadMenu();
