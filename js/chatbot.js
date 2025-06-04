// Initialize cart from localStorage
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
  // Prioritize Podo Pitha for veg or dessert preferences
  if (preferences.diet === 'veg' || preferences.wantsRecommendations) {
    filteredItems = filteredItems.sort((a, b) => {
      if (a.name === 'Podo Pitha' && (preferences.diet === 'veg' || a.category === 'Desserts')) return -1;
      if (b.name === 'Podo Pitha' && (preferences.diet === 'veg' || b.category === 'Desserts')) return 1;
      return b.price - a.price;
    });
  }
  return filteredItems.slice(0, 3);
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

  chatBtn.addEventListener('click', async () => {
    if (!window.menuItems || window.menuItems.length === 0) {
      try {
        await fetchMenuItems();
      } catch (error) {
        console.error('Failed to fetch menu items for chatbot:', error);
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
    if (msg.type === 'bot') {
      const wrapper = document.createElement('div');
      wrapper.className = 'chatbot-message-row';
      const avatar = document.createElement('img');
      avatar.className = 'waiter-avatar';
      avatar.src = 'Adobe Express - file.png'; // Person icon
      avatar.alt = 'Bot';
      wrapper.appendChild(avatar);

      const textSpan = document.createElement('span');
      textSpan.textContent = msg.text;
      textSpan.className = 'chatbot-bubble';
      wrapper.appendChild(textSpan);

      msgDiv.appendChild(wrapper);
    } else {
      const textSpan = document.createElement('span');
      textSpan.textContent = msg.text;
      msgDiv.appendChild(textSpan);
    }
    messages.appendChild(msgDiv);
  });

  const addMessage = (text, type = 'bot') => {
    window.chatState.messageHistory.push({ text, type });
    const msgDiv = document.createElement('div');
    msgDiv.className = `chatbot-message ${type}`;
    if (type === 'bot') {
      const wrapper = document.createElement('div');
      wrapper.className = 'chatbot-message-row';
      const avatar = document.createElement('img');
      avatar.className = 'waiter-avatar';
      avatar.src = 'Adobe Express - file.png'; // Person icon
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
      if (!suppressUserMessage) {
        addMessage(text, 'user');
      }
      action();
      window.renderChatbot();
    };
    options.appendChild(btn);
  };

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
    } else if (/^\d+$/.test(text)) {
      return 'fa-plus';
    }
    return null;
  };

  // Helper to generate random friendly phrases
  const getFriendlyGreeting = () => {
    const greetings = [
      'Hey there! Excited to help you explore our Odia delicacies! 😋',
      'Welcome back to Dinewise! Ready for some delicious picks? 🍽️',
      'Namaste! Let’s make your meal special today! 😊'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const getFriendlyRecommendationPrompt = () => {
    const prompts = [
      'Got a craving? I can suggest some mouth-watering dishes for you! 😍',
      'Want me to pick some tasty dishes based on your vibe? 🍲',
      'How about I recommend something special from our menu? 😊'
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  switch (window.chatState.step) {
    case 'welcome':
      addMessage(getFriendlyGreeting());
      addOption('Share my preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Share my preferences', 'welcome'), true);
      addOption('Show me the menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Show me the menu', 'welcome'));
      addOption('Check my cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('Check my cart', 'welcome'));
      addOption('See Orders', () => { window.chatState.step = 'view_past_orders'; }, null, getIconClass('See Orders', 'welcome'));
      addOption('I need help', () => { window.chatState.step = 'help'; }, null, getIconClass('I need help', 'welcome'));
      break;

    case 'choose_diet':
      addMessage('So, are you feeling like something vegetarian or non-vegetarian today?');
      ['Veg', 'Non-veg'].forEach(diet => {
        addOption(diet, () => {
          window.chatState.preferences.diet = diet.toLowerCase();
          window.chatState.step = 'choose_servings';
        }, null, getIconClass(diet, 'choose_diet'));
      });
      addOption('Not sure, skip this', () => { window.chatState.step = 'choose_servings'; }, null, getIconClass('Skip', 'choose_diet'));
      break;

    case 'choose_servings':
      if (
        window.chatState.messageHistory.length === 0 ||
        window.chatState.messageHistory[window.chatState.messageHistory.length - 1].text !== 'How many are you ordering for today?'
      ) {
        addMessage('How many are you ordering for today?');
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
      addMessage(getFriendlyRecommendationPrompt());
      addOption('Yes, surprise me!', () => {
        window.chatState.preferences.wantsRecommendations = true;
        window.chatState.step = 'show_recommendations';
      }, null, getIconClass('Yes', 'choose_recommendations'));
      addOption('I’ll browse myself', () => {
        window.chatState.preferences.wantsRecommendations = false;
        window.chatState.step = 'choose_category';
      }, null, getIconClass('No', 'choose_recommendations'));
      break;

    case 'show_recommendations':
      const recommendations = window.getRecommendations(window.chatState.preferences);
      if (recommendations.length === 0) {
        addMessage('Oh, looks like we don’t have dishes matching your preferences right now. How about browsing the menu or tweaking your choices?');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'show_recommendations'));
        addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'show_recommendations'));
        addOption('Check cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('Check cart', 'show_recommendations'));
      } else {
        addMessage(window.chatState.preferences.diet === 'veg' ?
          'I’ve picked some delicious vegetarian dishes for you! Our Podo Pitha is a must-try! 😋' :
          'Here’s a selection of our best dishes tailored for you! 🍽️');
        recommendations.forEach(item => {
          addOption(`${item.name} (₹${item.price})`, () => {
            window.chatState.selectedItem = item;
            window.chatState.step = 'choose_quantity';
          }, item.imageUrl, getIconClass(item.name, 'show_recommendations'));
        });
        addOption('Browse more', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse more', 'show_recommendations'));
        addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'show_recommendations'));
      }
      break;

    case 'choose_category':
      addMessage('What’s catching your fancy today? Maybe some desserts like our Podo Pitha? 😊');
      const categories = [...new Set(window.menuItems.map(item => item.category))];
      categories.forEach(category => {
        addOption(category, () => {
          window.chatState.selectedCategory = category;
          window.chatState.step = 'choose_item';
        }, null, getIconClass(category, 'choose_category'));
      });
      addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'choose_category'));
      addOption('Check cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('Check cart', 'choose_category'));
      break;

    case 'choose_item':
      addMessage(`Great choice! Here’s what we have in ${window.chatState.selectedCategory}. Anything tempting you?`);
      let items = window.menuItems.filter(item => item.category === window.chatState.selectedCategory);
      if (window.chatState.preferences.diet) {
        items = items.filter(item => item.diet === window.chatState.preferences.diet);
      }
      if (items.length === 0) {
        addMessage('Oops, no dishes match your preferences in this category. Try another one or adjust your preferences!');
        addOption('Pick another category', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Pick another category', 'choose_item'));
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
      addMessage(`How many ${window.chatState.selectedItem.name} would you like? Each serves ${window.chatState.selectedItem.servings}.`);
      [1, 2, 3, 4, 5].forEach(qty => {
        addOption(`${qty}`, () => {
          window.chatState.quantity = qty;
          window.chatState.step = 'confirm_order';
        }, null, getIconClass(`${qty}`, 'choose_quantity'));
      });
      addOption('Back', () => { window.chatState.step = 'choose_item'; }, null, getIconClass('Back', 'choose_quantity'));
      break;

    case 'confirm_order':
      addMessage(`All set to add ${window.chatState.quantity} ${window.chatState.selectedItem.name} for ₹${window.chatState.selectedItem.price * window.chatState.quantity}?`);
      addOption('Confirm', () => {
        window.addToCart(window.chatState.selectedItem.id, window.chatState.selectedItem.name ,window.chatState.selectedItem.price, window.chatState.quantity);
        window.chatState.step = 'order_added';
      }, null, getIconClass('Confirm', 'confirm_order'));
      addOption('Cancel', () => { window.chatState.step = 'choose_quantity'; }, null, getIconClass('Cancel', 'confirm_order'));
      break;

    case 'order_added':
      addMessage(`Awesome! ${window.chatState.selectedItem.name} is in your cart! What else can I get started for you? 😄`);
      if (window.chatState.preferences.servings && !window.checkServings()) {
        const totalServings = window.calculateTotalServings();
        addMessage(`Your order covers ${totalServings} servings, but you mentioned you need enough for ${window.chatState.preferences.servings}. Let’s add a bit more!`);
        addOption('Add another dish', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Add another dish', 'order_added'));
        addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'order_added'));
        addOption('Check cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('Check cart', 'order_added'));
      } else {
        addOption('Add another dish', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Add another dish', 'order_added'));
        addOption('Check cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('Check cart', 'order_added'));
        addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'order_added'));
        addOption('I’m done', () => { document.getElementById('chatbot').style.display = 'none'; }, null, getIconClass('I’m done', 'order_added'));
      }
      break;

    case 'view_cart':
      if (!window.cart || window.cart.length === 0) {
        addMessage('Your cart’s looking a bit empty. Shall we add some tasty Odia dishes, like our Podo Pitha? 😋');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_cart'));
        addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'view_cart'));
        addOption('See Orders', () => { window.chatState.step = 'view_past_orders'; }, null, getIconClass('See Orders', 'view_cart'));
        addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_cart'));
      } else {
        if (!window.menuItems || window.menuItems.length === 0) {
          addMessage('Hang on, the menu is still loading. Give it a moment and try again!');
          addOption('Retry', () => { window.renderChatbot(); }, null, getIconClass('Retry', 'view_cart'));
          addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_cart'));
          break;
        }
        addMessage('Here’s what you’ve got in your cart so far:');
        const cartCardsDiv = document.createElement('div');
        cartCardsDiv.className = 'chatbot-cart-cards';
        let hasValidItems = false;
        window.cart.forEach(cartItem => {
          if (!cartItem.id || !cartItem.name || !cartItem.price || !cartItem.quantity) {
            console.warn('Invalid cart item:', cartItem);
            return;
          }
          const menuItem = window.menuItems.find(item => item.id === cartItem.id);
          if (menuItem) {
            hasValidItems = true;
            const card = document.createElement('div');
            card.className = 'chatbot-cart-card';
            card.innerHTML = `
              <img src="${menuItem.imageUrl || 'https://via.placeholder.com/80'}" alt="${menuItem.name}" onerror="this.src='https://via.placeholder.com/80'">
              <div>
                <strong>${menuItem.name}</strong><br>
                Qty: ${cartItem.quantity}<br>
                Price: ₹${(menuItem.price * cartItem.quantity).toFixed(0)}
              </div>
            `;
            cartCardsDiv.appendChild(card);
          } else {
            console.warn('Menu item not found for cart item:', cartItem);
          }
        });
        if (!hasValidItems) {
          addMessage('Looks like there’s an issue with your cart items. Let’s add some fresh dishes!');
          addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_cart'));
          addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_cart'));
          break;
        }
        messages.appendChild(cartCardsDiv);
        const total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        addMessage(`Your total is ₹${total.toFixed(0)}. Ready to checkout or add more?`);
        if (window.chatState.preferences.servings && !window.checkServings()) {
          const totalServings = window.calculateTotalServings();
          addMessage(`Your order serves ${totalServings}, but you need enough for ${window.chatState.preferences.servings}. Let’s get a few more dishes!`);
          addOption('Add more dishes', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Add more dishes', 'view_cart'));
          addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'view_cart'));
          addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_cart'));
        } else {
          addOption('Proceed to checkout', () => { window.location.href = 'cart.html'; }, null, getIconClass('Proceed to checkout', 'view_cart'));
          addOption('Add more dishes', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Add more dishes', 'view_cart'));
          addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'view_cart'));
          addOption('See Orders', () => { window.chatState.step = 'view_past_orders'; }, null, getIconClass('See Orders', 'view_cart'));
          addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_cart'));
        }
      }
      break;

    case 'view_past_orders':
      addMessage('Let me check your Orders for you...');
      const user = firebase.auth().currentUser;
      if (!user) {
        addMessage('You’ll need to log in to see your Orders. Want to explore the menu instead?');
        addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
        addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
      } else {
        firebase.firestore().collection('orders')
          .where('userId', '==', user.uid)
          .orderBy('timestamp', 'desc')
          .get()
          .then(snapshot => {
            if (snapshot.empty) {
              addMessage('No Orders yet. How about starting a new one with something sweet like Podo Pitha? 😊');
              addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
              addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
            } else {
              addMessage('Here’s what you’ve ordered before:');
              snapshot.forEach(doc => {
                const order = doc.data();
                const orderItems = order.items
                  .map(item => `${item.name} (Qty: ${item.quantity}) - ₹${(item.price * item.quantity).toFixed(0)}`)
                  .join(', ');
                const orderDate = order.orderDate || (order.timestamp && order.timestamp.toDate
                  ? new Date(order.timestamp.toDate()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                  : 'Unknown');
                addMessage(`Order #${order.orderNumber} on ${orderDate}: ${orderItems}, Total: ₹${order.total}, Paid via ${order.paymentMethod}`);
              });
              addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
              addOption('Check cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('Check cart', 'view_past_orders'));
              addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
            }
            window.renderChatbot();
          })
          .catch(error => {
            console.error('Error fetching Orders:', error);
            addMessage('Sorry, I couldn’t load your Orders. Try again or browse the menu?');
            addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'view_past_orders'));
            addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'view_past_orders'));
            window.renderChatbot();
          });
      }
      break;

    case 'help':
      addMessage('Happy to assist! You can browse our menu, check your cart, see Orders, or call us at +91-123-456-7890 if you need more help.');
      addOption('Browse menu', () => { window.chatState.step = 'choose_category'; }, null, getIconClass('Browse menu', 'help'));
      addOption('Check cart', () => { window.chatState.step = 'view_cart'; }, null, getIconClass('Check cart', 'help'));
      addOption('See Orders', () => { window.chatState.step = 'view_past_orders'; }, null, getIconClass('See Orders', 'help'));
      addOption('Change preferences', () => { window.chatState.step = 'choose_diet'; }, null, getIconClass('Change preferences', 'help'));
      addOption('Back', () => { window.chatState.step = 'welcome'; }, null, getIconClass('Back', 'help'));
      break;
  }
};