// Word database with categories and hints - only nouns (things) and verbs (actions)
// Hints are single words that are vague but helpful
const wordDatabase = {
  animals: {
    words: [
      'elephant', 'tiger', 'dolphin', 'eagle', 'shark', 'bear', 'wolf', 'lion',
      'octopus', 'whale', 'penguin', 'giraffe', 'zebra', 'monkey', 'panda',
      'kangaroo', 'crocodile', 'snake', 'spider', 'butterfly', 'bee', 'ant',
      'rabbit', 'deer', 'fox', 'owl', 'parrot', 'seal', 'turtle', 'frog',
      'chicken', 'cow', 'pig', 'horse', 'sheep', 'goat', 'duck', 'swan'
    ],
    hints: ['animal', 'wildlife', 'creature', 'mammal', 'bird', 'reptile', 'insect', 'ocean', 'farm', 'pet']
  },
  food: {
    words: [
      'pizza', 'burger', 'pasta', 'sushi', 'taco', 'sandwich', 'salad', 'soup',
      'ice cream', 'cake', 'cookie', 'apple', 'banana', 'orange', 'strawberry',
      'chocolate', 'bread', 'cheese', 'coffee', 'tea', 'juice', 'water',
      'rice', 'noodles', 'steak', 'chicken', 'fish', 'egg', 'milk', 'yogurt',
      'donut', 'muffin', 'cereal', 'pancake', 'waffle', 'bagel'
    ],
    hints: ['food', 'meal', 'snack', 'drink', 'fruit', 'vegetable', 'dairy', 'meat', 'sweet', 'cow', 'chicken', 'wheat']
  },
  objects: {
    words: [
      'book', 'phone', 'computer', 'chair', 'table', 'lamp', 'clock', 'mirror',
      'window', 'door', 'key', 'pen', 'pencil', 'paper', 'bag', 'wallet',
      'glasses', 'watch', 'ring', 'necklace', 'hat', 'shoes', 'shirt', 'pants',
      'umbrella', 'camera', 'guitar', 'piano', 'ball', 'toy', 'bottle', 'cup',
      'plate', 'fork', 'knife', 'spoon', 'broom', 'vacuum'
    ],
    hints: ['furniture', 'tool', 'clothing', 'electronic', 'instrument', 'accessory', 'container', 'household', 'office', 'sports']
  },
  nature: {
    words: [
      'mountain', 'ocean', 'river', 'forest', 'tree', 'flower', 'sun', 'moon',
      'star', 'cloud', 'rain', 'snow', 'wind', 'storm', 'beach', 'island',
      'valley', 'desert', 'cave', 'waterfall', 'lake', 'volcano', 'rainbow',
      'sunset', 'sunrise', 'grass', 'leaf', 'rock', 'sand', 'ice', 'thunder',
      'lightning', 'fog', 'mist', 'dew'
    ],
    hints: ['nature', 'weather', 'landscape', 'sky', 'water', 'earth', 'plant', 'ocean', 'mountain', 'forest']
  },
  actions: {
    words: [
      'run', 'jump', 'swim', 'fly', 'dance', 'sing', 'laugh', 'cry', 'sleep',
      'eat', 'drink', 'read', 'write', 'draw', 'paint', 'build', 'break',
      'throw', 'catch', 'kick', 'hit', 'push', 'pull', 'climb', 'fall',
      'walk', 'sit', 'stand', 'think', 'speak', 'listen', 'watch', 'look',
      'smile', 'wave', 'hug', 'shake', 'point', 'nod', 'wink', 'blink'
    ],
    hints: ['movement', 'sport', 'emotion', 'communication', 'physical', 'mental', 'art', 'work', 'play', 'exercise']
  },
  body: {
    words: [
      'head', 'eye', 'nose', 'mouth', 'ear', 'hand', 'foot', 'arm', 'leg',
      'finger', 'toe', 'hair', 'tooth', 'tongue', 'neck', 'shoulder', 'knee',
      'elbow', 'wrist', 'ankle', 'chest', 'back', 'stomach', 'heart', 'brain',
      'bone', 'muscle', 'skin', 'blood', 'face', 'lip', 'chin', 'forehead',
      'eyebrow', 'eyelash', 'cheek', 'jaw'
    ],
    hints: ['body', 'face', 'limb', 'organ', 'skeleton', 'muscle', 'sensory', 'internal', 'external', 'anatomy']
  },
  places: {
    words: [
      'school', 'hospital', 'restaurant', 'store', 'park', 'beach', 'library',
      'museum', 'theater', 'stadium', 'airport', 'station', 'hotel', 'office',
      'factory', 'farm', 'church', 'temple', 'prison', 'court', 'bank',
      'post office', 'gym', 'spa', 'salon', 'market', 'mall', 'cinema',
      'zoo', 'aquarium', 'stadium', 'cafe', 'bar', 'club', 'arena'
    ],
    hints: ['building', 'public', 'business', 'entertainment', 'education', 'health', 'transport', 'religion', 'sports', 'recreation']
  },
  vehicles: {
    words: [
      'car', 'truck', 'bus', 'train', 'plane', 'boat', 'ship', 'bicycle',
      'motorcycle', 'scooter', 'helicopter', 'subway', 'taxi', 'van', 'SUV',
      'tractor', 'ambulance', 'fire truck', 'police car', 'tank', 'jet',
      'rocket', 'skateboard', 'rollerblades', 'sled', 'snowmobile'
    ],
    hints: ['vehicle', 'transport', 'road', 'air', 'water', 'land', 'public', 'private', 'emergency', 'sports']
  },
  sports: {
    words: [
      'soccer', 'basketball', 'football', 'baseball', 'tennis', 'golf', 'swimming',
      'running', 'cycling', 'boxing', 'wrestling', 'volleyball', 'hockey', 'skiing',
      'surfing', 'skating', 'diving', 'archery', 'fencing', 'badminton', 'rugby',
      'cricket', 'ping pong', 'bowling', 'darts', 'chess', 'poker'
    ],
    hints: ['sport', 'game', 'team', 'individual', 'ball', 'water', 'winter', 'combat', 'indoor', 'outdoor']
  },
  professions: {
    words: [
      'doctor', 'teacher', 'chef', 'pilot', 'artist', 'musician', 'engineer',
      'lawyer', 'police', 'firefighter', 'nurse', 'soldier', 'farmer', 'builder',
      'designer', 'writer', 'actor', 'singer', 'dancer', 'scientist', 'judge',
      'mechanic', 'barber', 'waiter', 'driver', 'photographer', 'journalist'
    ],
    hints: ['job', 'career', 'service', 'creative', 'medical', 'legal', 'education', 'emergency', 'entertainment', 'technical']
  }
};

// Get a random word and its hint
function getRandomWord() {
  const categories = Object.keys(wordDatabase);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const categoryData = wordDatabase[randomCategory];
  
  const word = categoryData.words[Math.floor(Math.random() * categoryData.words.length)];
  const hint = categoryData.hints[Math.floor(Math.random() * categoryData.hints.length)];
  
  return {
    word: word,
    hint: hint,
    category: randomCategory
  };
}

// Export for use in server
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { wordDatabase, getRandomWord };
}
