/**
 * Initialize cart from localStorage
 */
window.cart = JSON.parse(localStorage.getItem('cart')) || [];

/**
 * Chatbot state
 */
window.chatState = {
  step: 'welcome',
  preferences: { diet: null, servings: null, wantsRecommendations: null },
  selectedCategory: null,
  selectedItem: null,
  quantity: 1,
  messageHistory: [],
  tempServings: 1,
  orderData: null,
  paymentMethod: 'upi',
  customization: {}
};

/**
 * Calculate total servings in cart
 */
window.calculateTotalServings = function() {
  let totalServings = 0;
  window.cart.forEach(cartItem => {
    const menuItem = window.menuItems.find(item => item.id === cartItem.id);
    if (menuItem && menuItem.servings) {
      totalServings += menuItem.servings * cartItem.quantity;
    }
  });
  return totalServings;
};

/**
 * Check if cart meets serving preference
 */
window.checkServings = function() {
  if (!window.chatState.preferences.servings) return true;
  return window.calculateTotalServings() >= window.chatState.preferences.servings;
};

/**
 * Get personalized recommendations
 */
window.getRecommendations = function(preferences) {
  let filteredItems = (window.menuItems || []).filter(item => preferences.diet ? item.diet === preferences.diet : true);
  if (preferences.diet === 'veg' || preferences.wantsRecommendations) {
    filteredItems.sort((a, b) => a.name === 'Chhena Poda' && (preferences.diet === 'veg' || a.category === 'Desserts') ? -1 : 1);
  }
  return filteredItems.slice(0, 3);
};

/**
 * Add item to cart with customization
 */
window.addToCart = function(id, name, price, quantity, customization = {}) {
  const existingItem = window.cart.find(item => item.id === id && JSON.stringify(item.customization) === JSON.stringify(customization));
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    window.cart.push({ id, name, price, quantity, customization });
  }
  localStorage.setItem('cart', JSON.stringify(window.cart));
  console.log('Cart updated:', window.cart); // Debug log
};

/**
 * Initialize chatbot
 */
window.initializeChatbot = function() {
  const chatBtn = document.getElementById('chat-btn');
  const chatbot = document.getElementById('chatbot');
  const chatbotClose = document.getElementById('chatbot-close');

  if (!chatBtn || !chatbot || !chatbotClose) {
    console.error('Chatbot elements not found.');
    return;
  }

  chatBtn.addEventListener('click', async () => {
    if (!window.menuItems || window.menuItems.length === 0) {
      console.log('Fetching menu items...');
      try {
        await window.fetchMenuItems();
        console.log('Menu items loaded:', window.menuItems);
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      }
    }
    chatbot.style.display = 'flex';
    setTimeout(() => chatbot.classList.add('open'), 10);
    window.renderChatbot();
  });

  chatbotClose.addEventListener('click', () => {
    chatbot.classList.remove('open');
    setTimeout(() => { chatbot.style.display = 'none'; }, 400);
    window.chatState = {
      step: 'welcome',
      preferences: { diet: null, servings: null, wantsRecommendations: null },
      selectedCategory: null,
      selectedItem: null,
      quantity: 1,
      messageHistory: [],
      tempServings: 1,
      orderData: null,
      paymentMethod: 'upi',
      customization: {}
    };
  });
};

/**
 * Render chatbot UI
 */
window.renderChatbot = function() {
  const messages = document.getElementById('chatbot-messages');
  const options = document.getElementById('chatbot-options');
  if (!messages || !options) return;

  messages.innerHTML = '';
  options.innerHTML = '';

  const addMessage = (text, type = 'bot') => {
    window.chatState.messageHistory.push({ text, type });
    const msgDiv = document.createElement('div');
    msgDiv.className = `chatbot-message ${type}`;
    if (type === 'bot') {
      const wrapper = document.createElement('div');
      wrapper.className = 'chatbot-message-row';
      const avatar = document.createElement('img');
      avatar.className = 'waiter-avatar';
      avatar.src = 'Adobe Express - file.png';
      avatar.alt = 'Bot';
      wrapper.appendChild(avatar);
      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      textSpan.className = 'chatbot-bubble';
      wrapper.appendChild(textSpan);
      msgDiv.appendChild(wrapper);
    } else {
      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      msgDiv.appendChild(textSpan);
    }
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
  };

  const addOption = (text, action, imageUrl = null, iconClass = null, suppressUserMessage = false) => {
    const btn = document.createElement('button');
    btn.className = 'chatbot-option';
    if (iconClass) {
      const icon = document.createElement('i');
      icon.className = `fas ${iconClass}`;
      btn.appendChild(icon);
    }
    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = text;
      img.onerror = () => { img.src = 'https://via.placeholder.com/50'; };
      btn.appendChild(img);
    }
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    btn.appendChild(textSpan);
    btn.onclick = () => {
      if (!suppressUserMessage) addMessage(text, 'user');
      action();
      window.renderChatbot();
    };
    options.appendChild(btn);
  };

  const getIconClass = (text, step) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('preferences') || step === 'choose_diet' || step === 'choose_servings') return 'fa-user-cog';
    if (lowerText.includes('menu') || lowerText.includes('browse') || step === 'choose_category' || step === 'choose_item') return 'fa-utensils';
    if (lowerText.includes('cart') || lowerText.includes('checkout')) return 'fa-shopping-cart';
    if (lowerText.includes('orders')) return 'fa-history';
    if (lowerText.includes('help')) return 'fa-question-circle';
    if (lowerText.includes('confirm')) return 'fa-check';
    if (lowerText.includes('cancel') || lowerText.includes('back') || lowerText.includes('skip') || lowerText.includes('done')) return 'fa-arrow-left';
    if (lowerText.includes('yes')) return 'fa-thumbs-up';
    if (lowerText.includes('no')) return 'fa-thumbs-down';
    if (lowerText.includes('veg')) return 'fa-leaf';
    if (lowerText.includes('non-veg')) return 'fa-drumstick-bite';
    if (lowerText.includes('recommended') || lowerText.includes('recommend')) return 'fa-star';
    if (/^\d+$/.test(text)) return 'fa-plus';
    if (lowerText.includes('gravy')) return 'fa-tint';
    if (lowerText.includes('spicy') || lowerText.includes('spice')) return 'fa-pepper-hot';
    if (lowerText.includes('onion') || lowerText.includes('garlic')) return 'fa-carrot';
    return null;
  };

  switch (window.chatState.step) {
    case 'welcome':
      addMessage('Namaste! Ready to enjoy some Odia flavors? 😋 Let’s get started!');
      addOption('Share preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Share preferences', 'welcome'), true);
      addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'welcome'));
      addOption('Check cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('Check cart', 'welcome'));
      addOption('View past orders', () => { window.chatState.step = 'view_past_orders'; }, null, getIconClass('View past orders', 'welcome'));
      addOption('Help', () => { window.chatState.step = 'help'; }, null, getIconClass('Help', 'welcome'));
      break;

    case 'choose_diet':
      addMessage('Veg or non-veg today? 😊');
      ['Veg', 'Non-veg'].forEach(diet => addOption(diet, () => {
        window.chatState.preferences.diet = diet.toLowerCase();
        window.chatState.step = 'choose_servings';
      }, null, getIconClass(diet, 'choose_diet')));
      addOption('Skip', () => { window.chatState.step = 'choose_servings'; }, null, getIconClass('Skip', 'choose_diet'));
      break;

    case 'choose_servings':
      addMessage('How many are dining? I’ll help with portions! 😄');
      const counterDiv = document.createElement('div');
      counterDiv.className = 'servings-counter';
      counterDiv.innerHTML = `
        <button onclick="window.adjustServings(-1)">–</button>
        <span>${window.chatState.tempServings}</span>
        <button onclick="window.adjustServings(1)">+</button>
        <button class="enter-btn" onclick="window.confirmServings()">Enter</button>
      `;
      options.appendChild(counterDiv);
      addOption('Skip', () => {
        window.chatState.preferences.servings = null;
        window.chatState.tempServings = 1;
        window.chatState.step = 'choose_recommendations';
      }, null, getIconClass('Skip', 'choose_servings'));
      window.adjustServings = (change) => {
        window.chatState.tempServings = Math.max(1, window.chatState.tempServings + change);
        window.renderChatbot();
      };
      window.confirmServings = () => {
        addMessage(`${window.chatState.tempServings}`, 'user');
        window.chatState.preferences.servings = window.chatState.tempServings;
        window.chatState.tempServings = 1;
        window.chatState.step = 'choose_recommendations';
        window.renderChatbot();
      };
      break;

    case 'choose_recommendations':
      addMessage('Want some Odia dish suggestions, like Dalma or Chhena Poda? 😍');
      addOption('Yes', () => {
        window.chatState.preferences.wantsRecommendations = true;
        window.chatState.step = 'show_recommendations';
      }, null, getIconClass('Yes', 'choose_recommendations'));
      addOption('No, I’ll browse', () => {
        window.chatState.preferences.wantsRecommendations = false;
        window.chatState.step = 'choose_category';
      }, null, getIconClass('No', 'choose_recommendations'));
      break;

    case 'show_recommendations':
      if (!window.menuItems || window.menuItems.length === 0) {
        console.warn('Menu items not loaded in show_recommendations');
        addMessage('Menu’s still loading. Try again or browse categories! 😊');
        addOption('Retry', () => { window.renderChatbot(); }, null, getIconClass('Retry', 'show_recommendations'));
        addOption('Browse categories', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse categories', 'show_recommendations'));
        break;
      }
      const recommendations = window.getRecommendations(window.chatState.preferences);
      if (recommendations.length === 0) {
        addMessage('No matches for your preferences. Let’s browse or tweak them! 😊');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'show_recommendations'));
        addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'show_recommendations'));
      } else {
        addMessage('Here’s some Odia goodness for you! 🍽️');
        recommendations.forEach(item => {
          console.log(`Recommendation: ${item.name}, Customizable: ${item.isCustomizable}`);
          addOption(`${item.name} (₹${item.price})${item.isCustomizable ? ' *Customizable*' : ''}`, () => {
            window.chatState.selectedItem = item;
            console.log(`Selected ${item.name}, transitioning to ${item.isCustomizable ? 'customize_item' : 'choose_quantity'}`);
            window.chatState.step = item.isCustomizable ? 'customize_item' : 'choose_quantity';
          }, item.imageUrl, getIconClass(item.name, 'show_recommendations'));
        });
        addOption('Browse more', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse more', 'show_recommendations'));
      }
      break;

    case 'choose_category':
      if (!window.menuItems || window.menuItems.length === 0) {
        console.warn('Menu items not loaded in choose_category');
        addMessage('Menu’s loading. Try again or go back! 😊');
        addOption('Retry', () => { window.renderChatbot(); }, null, getIconClass('Retry', 'choose_category'));
        addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'choose_category'));
        break;
      }
      addMessage('What’s tempting you? Dalma or maybe Chhena Poda? 😊');
      const categories = [...new Set(window.menuItems.map(item => item.category))];
      categories.forEach(category => addOption(category, () => {
        window.chatState.selectedCategory = category;
        window.chatState.step = 'choose_item';
      }, null, getIconClass(category, 'choose_category')));
      addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'choose_category'));
      break;

    case 'choose_item':
      if (!window.menuItems || window.menuItems.length === 0) {
        console.warn('Menu items not loaded in choose_item');
        addMessage('Menu’s loading. Try again or go back! 😊');
        addOption('Retry', () => { window.renderChatbot(); }, null, getIconClass('Retry', 'choose_item'));
        addOption('Back', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Back', 'choose_item'));
        break;
      }
      addMessage(`Here’s what’s in ${window.chatState.selectedCategory}! 😋`);
      let items = window.menuItems.filter(item => item.category === window.chatState.selectedCategory);
      if (window.chatState.preferences.diet) items = items.filter(item => item.diet === window.chatState.preferences.diet);
      if (items.length === 0) {
        addMessage('No dishes match here. Try another category! 😊');
        addOption('Pick another category', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Pick another category', 'choose_item'));
      } else {
        items.forEach(item => {
          console.log(`Item: ${item.name}, Customizable: ${item.isCustomizable}`);
          addOption(`${item.name} (₹${item.price})${item.isCustomizable ? ' *Customizable*' : ''}`, () => {
            window.chatState.selectedItem = item;
            console.log(`Selected ${item.name}, transitioning to ${item.isCustomizable ? 'customize_item' : 'choose_quantity'}`);
            window.chatState.step = item.isCustomizable ? 'customize_item' : 'choose_quantity';
          }, item.imageUrl, getIconClass(item.name, 'choose_item'));
        });
      }
      addOption('Back', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Back', 'choose_item'));
      break;

    case 'customize_item':
      if (!window.chatState.selectedItem) {
        console.error('No selected item in customize_item');
        addMessage('Something went wrong. Let’s pick a dish again! 😊');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'customize_item'));
        break;
      }
      addMessage(`Great pick with ${window.chatState.selectedItem.name}! Let’s customize it! 😋`);
      window.chatState.customization = {};
      addMessage(`How much gravy for your ${window.chatState.selectedItem.name}?`);
      ['Light', 'Medium', 'Extra'].forEach(level => addOption(`${level} Gravy`, () => {
        window.chatState.customization.gravy = level.toLowerCase();
        window.chatState.step = 'customize_spiciness';
      }, null, getIconClass('Gravy', 'customize_item')));
      addOption('Skip', () => { window.chatState.step = 'customize_spiciness'; }, null, getIconClass('Skip', 'customize_item'));
      break;

    case 'customize_spiciness':
      if (!window.chatState.selectedItem) {
        console.error('No selected item in customize_spiciness');
        addMessage('Something went wrong. Let’s pick a dish again! 😊');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'customize_spiciness'));
        break;
      }
      addMessage(`How spicy do you want your ${window.chatState.selectedItem.name}? 🌶️`);
      ['Mild', 'Medium', 'Spicy'].forEach(level => addOption(level, () => {
        window.chatState.customization.spiciness = level.toLowerCase();
        window.chatState.step = 'customize_onion_garlic';
      }, null, getIconClass('Spicy', 'customize_spiciness')));
      addOption('Skip', () => { window.chatState.step = 'customize_onion_garlic'; }, null, getIconClass('Skip', 'customize_spiciness'));
      break;

    case 'customize_onion_garlic':
      if (!window.chatState.selectedItem) {
        console.error('No selected item in customize_onion_garlic');
        addMessage('Something went wrong. Let’s pick a dish again! 😊');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'customize_onion_garlic'));
        break;
      }
      addMessage(`Onion and garlic in your ${window.chatState.selectedItem.name}?`);
      addOption('With Onion & Garlic', () => {
        window.chatState.customization.onionGarlic = 'with';
        window.chatState.step = 'choose_quantity';
      }, null, getIconClass('Onion', 'customize_onion_garlic'));
      addOption('Without Onion & Garlic', () => {
        window.chatState.customization.onionGarlic = 'without';
        window.chatState.step = 'choose_quantity';
      }, null, getIconClass('Onion', 'customize_onion_garlic'));
      addOption('Skip', () => { window.chatState.step = 'choose_quantity'; }, null, getIconClass('Skip', 'customize_onion_garlic'));
      break;

    case 'choose_quantity':
      if (!window.chatState.selectedItem) {
        console.error('No selected item in choose_quantity');
        addMessage('Something went wrong. Let’s pick a dish again! 😊');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'choose_quantity'));
        break;
      }
      addMessage(`How many servings of ${window.chatState.selectedItem.name}? Serves ${window.chatState.selectedItem.servings}.`);
      [1, 2, 3].forEach(qty => addOption(`${qty}`, () => {
        window.chatState.quantity = qty;
        window.chatState.step = 'confirm_order';
      }, null, getIconClass(`${qty}`, 'choose_quantity')));
      addOption('Back', () => {
        window.chatState.step = window.chatState.selectedItem.isCustomizable ? 'customize_item' : 'choose_item';
      }, null, getIconClass('Back', 'choose_quantity'));
      break;

    case 'confirm_order':
      if (!window.chatState.selectedItem) {
        console.error('No selected item in confirm_order');
        addMessage('Something went wrong. Let’s pick a dish again! 😊');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'confirm_order'));
        break;
      }
      const customizationText = Object.keys(window.chatState.customization).length ? ` (${Object.entries(window.chatState.customization).map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`).join(', ')})` : '';
      addMessage(`Add ${window.chatState.quantity} ${window.chatState.selectedItem.name}${customizationText} for ₹${window.chatState.selectedItem.price * window.chatState.quantity}?`);
      addOption('Confirm', () => {
        window.addToCart(
          window.chatState.selectedItem.id,
          window.chatState.selectedItem.name,
          window.chatState.selectedItem.price,
          window.chatState.quantity,
          window.chatState.customization
        );
        window.chatState.customization = {};
        window.chatState.step = 'order_added';
      }, null, getIconClass('Confirm', 'confirm_order'));
      addOption('Cancel', () => {
        window.chatState.step = window.chatState.selectedItem.isCustomizable ? 'customize_item' : 'choose_quantity';
      }, null, getIconClass('Cancel', 'confirm_order'));
      break;

    case 'order_added':
      addMessage(`Your ${window.chatState.selectedItem.name} is in the cart! What’s next? 😄`);
      if (window.chatState.preferences.servings && !window.checkServings()) {
        const totalServings = window.calculateTotalServings();
        addMessage(`Your order serves ${totalServings}, but you need ${window.chatState.preferences.servings}. Add more?`);
        addOption('Add dish', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Add dish', 'order_added'));
        addOption('Check cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('Check cart', 'order_added'));
      } else {
        addOption('Add dish', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Add dish', 'order_added'));
        addOption('Check cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('Check cart', 'order_added'));
        addOption('Done', () => { document.getElementById('chatbot').style.display = 'none'; }, null, getIconClass('Done', 'order_added'));
      }
      break;

    case 'view_cart':
      if (!window.cart.length) {
        addMessage('Cart’s empty! Let’s add some Dalma or Chhena Poda! 😋');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_cart'));
        addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_cart'));
      } else {
        if (!window.menuItems || window.menuItems.length === 0) {
          console.warn('Menu items not loaded in view_cart');
          addMessage('Menu’s loading. Try again! 😊');
          addOption('Retry', () => { window.renderChatbot(); }, null, getIconClass('Retry', 'view_cart'));
          addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_cart'));
          break;
        }
        addMessage('Your cart:');
        const cartCardsDiv = document.createElement('div');
        cartCardsDiv.className = 'chatbot-cart-cards';
        window.cart.forEach(cartItem => {
          const menuItem = window.menuItems.find(item => item.id === cartItem.id);
          if (menuItem) {
            const customizationText = Object.keys(cartItem.customization).length ? ` (${Object.entries(cartItem.customization).map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`).join(', ')})` : '';
            const card = document.createElement('div');
            card.className = 'chatbot-cart-card';
            card.innerHTML = `
              <img src="${menuItem.imageUrl || 'https://via.placeholder.com/80'}" alt="${menuItem.name}" onerror="this.src='https://via.placeholder.com/80'">
              <div>
                <strong>${menuItem.name}${customizationText}</strong><br>
                Qty: ${cartItem.quantity}<br>
                Price: ₹${(menuItem.price * cartItem.quantity).toFixed(0)}
              </div>
            `;
            cartCardsDiv.appendChild(card);
          }
        });
        messages.appendChild(cartCardsDiv);
        const total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        addMessage(`Total: ₹${total}. Checkout or add more? 😄`);
        addOption('Checkout', () => { window.location.href = 'cart.html'; }, null, getIconClass('Checkout', 'view_cart'));
        addOption('Add more', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Add more', 'view_cart'));
        addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_cart'));
      }
      break;

    case 'view_past_orders':
      addMessage('Checking your past orders... 😊');
      const user = firebase.auth().currentUser;
      if (!user) {
        addMessage('Please log in to see past orders. Browse instead? 🍽️');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
        addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
      } else {
        firebase.firestore().collection('orders').where('userId', '==', user.uid).orderBy('timestamp', 'desc').get()
          .then(snapshot => {
            if (snapshot.empty) {
              addMessage('No past orders. Try some Dalma today? 😋');
              addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
              addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
            } else {
              addMessage('Your past orders:');
              snapshot.forEach(doc => {
                const order = doc.data();
                const orderItems = order.items.map(item => {
                  const customizationText = Object.keys(item.customization || {}).length ? ` (${Object.entries(item.customization).map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`).join(', ')})` : '';
                  return `${item.name}${customizationText} (Qty: ${item.quantity}) - ₹${(item.price * item.quantity).toFixed(0)}`;
                }).join(', ');
                const orderDate = order.timestamp?.toDate ? new Date(order.timestamp.toDate()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown';
                addMessage(`Order #${order.orderNumber} on ${orderDate}: ${orderItems}, Total: ₹${order.total}`);
              });
              addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
              addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
            }
            window.renderChatbot();
          })
          .catch(error => {
            console.error('Error fetching past orders:', error);
            addMessage('Couldn’t load past orders. Browse the menu? 😊');
            addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
            addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
            window.renderChatbot();
          });
      }
      break;

    case 'help':
      addMessage('Need help? Browse, customize dishes like Dalma, check your cart, or call +91-123-456-7890! 😄');
      addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'help'));
      addOption('Check cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('Check cart', 'help'));
      addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'help'));
      break;
  }
};