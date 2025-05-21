window.cart = JSON.parse(localStorage.getItem('cart')) || [];

// Chatbot state
window.chatState = {
  step: 'welcome',
  preferences: {
    diet: null,
    servings: null,
    wantsRecommendations: null
  },
  selectedCategory: null,
  selectedItem: null,
  quantity: 1,
  messageHistory: [],
  tempServings: 1,
  orderData: null,
  paymentMethod: 'upi' // Default to UPI
};

// Calculate total servings in cart
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

// Check if cart meets serving preference
window.checkServings = function() {
  if (!window.chatState.preferences.servings) return true;
  const totalServings = window.calculateTotalServings();
  return totalServings >= window.chatState.preferences.servings;
};

// Get personalized recommendations
window.getRecommendations = function(preferences) {
  let filteredItems = window.menuItems;
  if (preferences.diet) {
    filteredItems = filteredItems.filter(item => item.diet === preferences.diet);
  }
  return filteredItems.sort((a, b) => b.price - a.price).slice(0, 3);
};

// Chatbot logic
window.initializeChatbot = function() {
  const chatBtn = document.getElementById('chat-btn');
  const chatbot = document.getElementById('chatbot');
  const chatbotClose = document.getElementById('chatbot-close');

  if (!chatBtn || !chatbot || !chatbotClose) {
    console.error('Chatbot elements not found.');
    return;
  }

  chatBtn.addEventListener('click', () => {
    chatbot.style.display = 'flex';
    setTimeout(() => chatbot.classList.add('open'), 10); // Delay to trigger animation
    window.renderChatbot();
  });

  chatbotClose.addEventListener('click', () => {
    chatbot.classList.remove('open');
    setTimeout(() => { chatbot.style.display = 'none'; }, 400); // Match transition duration
    window.chatState = {
      step: 'welcome',
      preferences: { diet: null, servings: null, wantsRecommendations: null },
      selectedCategory: null,
      selectedItem: null,
      quantity: 1,
      messageHistory: [],
      tempServings: 1,
      orderData: null,
      paymentMethod: 'upi'
    };
  });
};

// Updated renderChatbot
window.renderChatbot = function() {
  const messages = document.getElementById('chatbot-messages');
  const options = document.getElementById('chatbot-options');
  if (!messages || !options) return;

  messages.innerHTML = '';
  options.innerHTML = '';

  // Display message history
  window.chatState.messageHistory.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chatbot-message ${msg.type}`;
    // Use innerHTML for bot messages that look like HTML, else textContent
    if (msg.type === 'bot' && msg.text.trim().startsWith('<')) {
      msgDiv.innerHTML = msg.text;
    } else {
      msgDiv.textContent = msg.text;
    }
    messages.appendChild(msgDiv);
  });

  // Updated addMessage function
  const addMessage = (text, type = 'bot') => {
    window.chatState.messageHistory.push({ text, type });
    const msgDiv = document.createElement('div');
    msgDiv.className = `chatbot-message ${type}`;
    if (type === 'bot' && text.trim().startsWith('<')) {
      msgDiv.innerHTML = text;
    } else {
      msgDiv.textContent = text;
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
      if (!suppressUserMessage) {
        addMessage(text, 'user');
      }
      action();
      window.renderChatbot();
    };
    options.appendChild(btn);
  };

  // Helper function to assign icons based on option text or context
  const getIconClass = (text, step) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('preferences') || step === 'choose_diet' || step === 'choose_servings') {
      return 'fa-user-cog';
    } else if (lowerText.includes('menu') || lowerText.includes('browse') || step === 'choose_category' || step === 'choose_item') {
      return 'fa-utensils';
    } else if (lowerText.includes('cart') || lowerText.includes('checkout')) {
      return 'fa-shopping-cart';
    } else if (lowerText.includes('orders')) {
      return 'fa-history';
    } else if (lowerText.includes('help')) {
      return 'fa-question-circle';
    } else if (lowerText.includes('confirm')) {
      return 'fa-check';
    } else if (lowerText.includes('cancel') || lowerText.includes('back') || lowerText.includes('skip') || lowerText.includes('done')) {
      return 'fa-arrow-left';
    } else if (lowerText.includes('yes')) {
      return 'fa-thumbs-up';
    } else if (lowerText.includes('no')) {
      return 'fa-thumbs-down';
    } else if (lowerText.includes('veg')) {
      return 'fa-leaf';
    } else if (lowerText.includes('non-veg')) {
      return 'fa-drumstick-bite';
    } else if (lowerText.includes('recommended') || lowerText.includes('recommend')) {
      return 'fa-star';
    } else if (/^\d+$/.test(text)) { // For quantity numbers
      return 'fa-plus';
    }
    return null; // Default: no icon
  };

  switch (window.chatState.step) {
    case 'welcome':
      addMessage('Namaste! Welcome to TastyBites! I’m your virtual waiter, here to make your Odia food experience amazing. 😊 Let’s get started!');
      addOption('Tell me about your preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Tell me about your preferences', 'welcome'), true); // Suppress user message
      addOption('Browse menu directly', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu directly', 'welcome'));
      addOption('View cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('View cart', 'welcome'));
      addOption('View past orders', () => { window.chatState.step = 'view_past_orders'; }, null, getIconClass('View past orders', 'welcome'));
      addOption('Need help', () => { window.chatState.step = 'help'; }, null, getIconClass('Need help', 'welcome'));
      break;

    case 'choose_diet':
      addMessage('Are you in the mood for veg or non-veg delights?');
      ['veg', 'non-veg'].forEach(diet => {
        addOption(diet.charAt(0).toUpperCase() + diet.slice(1), () => {
          window.chatState.preferences.diet = diet;
          window.chatState.step = 'choose_servings';
        }, null, getIconClass(diet, 'choose_diet'));
      });
      addOption('Skip', () => { window.chatState.step = 'choose_servings'; }, null, getIconClass('Skip', 'choose_diet'));
      break;

    case 'choose_servings':
      if (
        window.chatState.messageHistory.length === 0 ||
        window.chatState.messageHistory[window.chatState.messageHistory.length - 1].text !== 'How many people are you ordering for?'
      ) {
        addMessage('How many people are you ordering for?');
      }
      const counterDiv = document.createElement('div');
      counterDiv.className = 'servings-counter';
      counterDiv.innerHTML = `
        <button onclick="window.adjustServings(-1)">–</button>
        <span>${window.chatState.tempServings}</span>
        <button onclick="window.adjustServings(1)">+</button>
        <button class="enter-btn" onclick="window.confirmServings()">Enter</button>
      `;
      options.appendChild(counterDiv);
      const skipBtn = document.createElement('button');
      skipBtn.className = 'chatbot-option';
      const skipIcon = document.createElement('i');
      skipIcon.className = `fas ${getIconClass('Skip', 'choose_servings')}`;
      skipBtn.appendChild(skipIcon);
      const skipText = document.createElement('span');
      skipText.textContent = 'Skip';
      skipBtn.appendChild(skipText);
      skipBtn.onclick = () => {
        addMessage('Skip', 'user');
        window.chatState.preferences.servings = null;
        window.chatState.tempServings = 1;
        window.chatState.step = 'choose_recommendations';
        window.renderChatbot();
      };
      options.appendChild(skipBtn);
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
      addMessage('Would you like me to suggest some dishes based on your preferences?');
      addOption('Yes, please!', () => {
        window.chatState.preferences.wantsRecommendations = true;
        window.chatState.step = 'show_recommendations';
      }, null, getIconClass('Yes', 'choose_recommendations'));
      addOption('No, I’ll browse', () => {
        window.chatState.preferences.wantsRecommendations = false;
        window.chatState.step = 'choose_category';
      }, null, getIconClass('No', 'choose_recommendations'));
      break;

    case 'show_recommendations':
      const recommendations = window.getRecommendations(window.chatState.preferences);
      if (recommendations.length === 0) {
        addMessage('Hmm, no dishes match your preferences perfectly. Let’s try browsing the menu or adjusting your choices!');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'show_recommendations'));
        addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'show_recommendations'));
        addOption('View cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('View cart', 'show_recommendations'));
      } else {
        addMessage('Here are my top picks for you! 🍽️');
        recommendations.forEach(item => {
          addOption(`Recommended: ${item.name} (₹${item.price})`, () => {
            window.chatState.selectedItem = item;
            window.chatState.step = 'choose_quantity';
          }, item.imageUrl, getIconClass('Recommended', 'show_recommendations'));
        });
        addOption('Browse more', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse more', 'show_recommendations'));
        addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'show_recommendations'));
      }
      break;

    case 'choose_category':
      addMessage('What kind of dish are you craving today?');
      const categories = [...new Set(window.menuItems.map(item => item.category))];
      categories.forEach(category => {
        addOption(category, () => {
          window.chatState.selectedCategory = category;
          window.chatState.step = 'choose_item';
        }, null, getIconClass(category, 'choose_category'));
      });
      addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'choose_category'));
      addOption('View cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('View cart', 'choose_category'));
      break;

    case 'choose_item':
      addMessage(`Awesome! Here are our ${window.chatState.selectedCategory}. What looks tasty?`);
      let items = window.menuItems.filter(item => item.category === window.chatState.selectedCategory);
      if (window.chatState.preferences.diet) {
        items = items.filter(item => item.diet === window.chatState.preferences.diet);
      }
      if (items.length === 0) {
        addMessage('Oops, no items match your preferences in this category. Try another category or adjust your preferences!');
        addOption('Choose another category', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Choose another category', 'choose_item'));
        addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'choose_item'));
      } else {
        items.forEach(item => {
          addOption(`${item.name} (₹${item.price})`, () => {
            window.chatState.selectedItem = item;
            window.chatState.step = 'choose_quantity';
          }, item.imageUrl, getIconClass(item.name, 'choose_item'));
        });
      }
      addOption('Back', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Back', 'choose_item'));
      break;

    case 'choose_quantity':
      addMessage(`How many ${window.chatState.selectedItem.name} would you like? (Serves ${window.chatState.selectedItem.servings})`);
      [1, 2, 3, 4, 5].forEach(qty => {
        addOption(`${qty}`, () => {
          window.chatState.quantity = qty;
          window.chatState.step = 'confirm_order';
        }, null, getIconClass(`${qty}`, 'choose_quantity'));
      });
      addOption('Back', () => { window.chatState.step = 'choose_item'; }, null, getIconClass('Back', 'choose_quantity'));
      break;

    case 'confirm_order':
      addMessage(`Ready to add ${window.chatState.quantity} ${window.chatState.selectedItem.name} to your cart for ₹${window.chatState.selectedItem.price * window.chatState.quantity}?`);
      addOption('Confirm', () => {
        window.addToCart(window.chatState.selectedItem.id, window.chatState.selectedItem.name, window.chatState.selectedItem.price, window.chatState.quantity);
        window.chatState.step = 'order_added';
      }, null, getIconClass('Confirm', 'confirm_order'));
      addOption('Cancel', () => { window.chatState.step = 'choose_quantity'; }, null, getIconClass('Cancel', 'confirm_order'));
      break;

    case 'order_added':
      addMessage('Yay, your order is in the cart! What’s next on your plate?');
      if (window.chatState.preferences.servings && !window.checkServings()) {
        const totalServings = window.calculateTotalServings();
        addMessage(`Your order currently serves ${totalServings}, but you need enough for ${window.chatState.preferences.servings} people. Let’s add more dishes!`);
        addOption('Add another item', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Add another item', 'order_added'));
        addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'order_added'));
        addOption('View cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('View cart', 'order_added'));
      } else {
        addOption('Add another item', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Add another item', 'order_added'));
        addOption('View cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('View cart', 'order_added'));
        addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'order_added'));
        addOption('Done', () => { document.getElementById('chatbot').style.display = 'none'; }, null, getIconClass('Done', 'order_added'));
      }
      break;

   case 'view_cart':
      window.cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (window.cart.length === 0) {
    addMessage('Your cart is empty. Let’s fill it with some delicious Odia dishes!');
    addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_cart'));
    addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'view_cart'));
    addOption('View past orders', () => { window.chatState.step = 'view_past_orders'; }, null, getIconClass('View past orders', 'view_cart'));
    addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_cart'));
  } else {
    const cartCardsDiv = document.createElement('div');
    cartCardsDiv.className = 'chatbot-cart-cards';
    window.cart.forEach(cartItem => {
      const menuItem = window.menuItems.find(item => item.id === cartItem.id);
      if (menuItem) {
        const card = document.createElement('div');
        card.className = 'chatbot-cart-card';
        card.innerHTML = `
          <img src="${menuItem.imageUrl}" alt="${menuItem.name}" onerror="this.src='https://via.placeholder.com/80'">
          <div>
            <strong>${menuItem.name}</strong><br>
            Qty: ${cartItem.quantity}<br>
            Price: ₹${(menuItem.price * cartItem.quantity).toFixed(0)}
          </div>
        `;
        cartCardsDiv.appendChild(card);
      }
    });
    messages.appendChild(cartCardsDiv);

    const total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    addMessage(`Total: ₹${total}`);

    if (window.chatState.preferences.servings && !window.checkServings()) {
      const totalServings = window.calculateTotalServings();
      addMessage(`Your order serves ${totalServings}, but you need enough for ${window.chatState.preferences.servings} people. Please add more dishes to proceed!`);
      addOption('Add more items', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Add more items', 'view_cart'));
      addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'view_cart'));
      addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_cart'));
    } else {
      addOption('Checkout', () => { window.location.href = 'cart.html'; }, null, getIconClass('Checkout', 'view_cart'));
      addOption('Add more items', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Add more items', 'view_cart'));
      addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'view_cart'));
      addOption('View past orders', () => { window.chatState.step = 'view_past_orders'; }, null, getIconClass('View past orders', 'view_cart'));
      addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_cart'));
    }
  }
  break;
    case 'view_past_orders':
      addMessage('Let me fetch your past orders...');
      const user = firebase.auth().currentUser;
      if (!user) {
        addMessage('Please log in to view your past orders.');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
        addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
      } else {
        firebase.firestore().collection('orders')
          .where('userId', '==', user.uid)
          .get()
          .then(snapshot => {
            if (snapshot.empty) {
              addMessage('No past orders found.');
              addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
              addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
            } else {
              addMessage('Here are your past orders:');
              snapshot.forEach(doc => {
                const order = doc.data();
                const orderItems = order.items
                  .map(item => `${item.name} (Qty: ${item.quantity}) - ₹${(item.price * item.quantity).toFixed(0)}`)
                  .join(', ');
                const orderDate = order.orderDate || (order.timestamp && order.timestamp.toDate
                  ? new Date(order.timestamp.toDate()).toLocaleString()
                  : 'Unknown');
                addMessage(
                  `
                  <div style="background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.07);padding:16px 14px 10px 14px;margin-bottom:18px;">
                    <div style="font-weight:bold;color:#4285F4;margin-bottom:6px;">
                      Order #${order.orderNumber || doc.id} <span style="float:right;font-weight:normal;color:#888;">${orderDate}</span>
                    </div>
                    <ul style="padding-left:18px;margin:0 0 8px 0;">
                      ${order.items.map(i => `<li style="margin-bottom:3px;"><strong>${i.name}</strong> ×${i.quantity} <span style="float:right;">₹${(i.price * i.quantity).toFixed(0)}</span></li>`).join('')}
                    </ul>
                    <div style="font-weight:bold;color:#388e3c;">Total: ₹${order.total}</div>
                    <div style="font-size:0.97em;color:#444;margin-top:4px;">
                      <span><strong>Paid via:</strong> ${order.paymentMethod || 'N/A'}</span><br>
                      <span><strong>Delivered to:</strong> ${order.address || 'N/A'}</span>
                    </div>
                  </div>
                  `,
                  'bot'
                );
              });
              addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
              addOption('View cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('View cart', 'view_past_orders'));
              addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
            }
          })
          .catch(error => {
            console.error('Error fetching past orders:', error);
            addMessage('Failed to load past orders. Please try again later.');
            addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
            addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
          });
      }
      break;

    case 'help':
      addMessage('I’m here to help! Browse the menu, add items to your cart, view past orders, or contact us at +91-123-456-7890.');
      addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'help'));
      addOption('View cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('View cart', 'help'));
      addOption('View past orders', () => { window.chatState.step = 'view_past_orders'; }, null, getIconClass('View past orders', 'help'));
      addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'help'));
      addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'help'));
      break;
  }
};

// Initialize cart from localStorage
