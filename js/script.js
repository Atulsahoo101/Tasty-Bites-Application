

// Cart state (load from localStorage or initialize empty)
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let menuItems = [];
if (!window.chatState) {
  window.chatState = {
    paymentMethod: 'upi',
    messageHistory: []
  };
}
// Fetch menu items from Firestore
async function fetchMenuItems() {
  try {
    const menuCollection = firebase.firestore().collection('menu');
    const snapshot = await menuCollection.get();
    window.menuItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (!Array.isArray(window.menuItems)) {
      throw new Error('Invalid menu data: Expected an array');
    }
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
      displayRecommendations(window.menuItems);
      displayCategoryFilter(window.menuItems);
      displayAllItems(window.menuItems);
      window.initializeChatbot(); // Ensure this runs after menuItems is populated
    }
    updateCartCount();
  } catch (error) {
    console.error('Error fetching menu items from Firestore:', error);
    const container = document.getElementById('recommendations') || document.getElementById('all-items');
    if (container) {
      container.innerHTML = `<p style="color: red; text-align: center;">Failed to load menu. Please try again later.</p>`;
    }
    // Display error in chatbot if open
    if (window.chatState && document.getElementById('chatbot').style.display === 'flex') {
      window.chatState.messageHistory.push({
        text: 'Failed to load menu items. Please try again later.',
        type: 'bot'
      });
      window.renderChatbot();
    }
  }
}

// Display recommendations (random 3 items)
function displayRecommendations(items) {
  const recommendations = items.sort(() => 0.5 - Math.random()).slice(0, 3);
  const container = document.getElementById('recommendations');
  if (!container) return;
  container.innerHTML = '';
  recommendations.forEach(item => {
    if (item.id && item.name && item.price && item.description && item.imageUrl) {
      container.innerHTML += `
        <div class="food-card">
          <img src="${item.imageUrl}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/200'">
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          <p class="price">₹${Number(item.price).toFixed(0)}</p>
          <button onclick="addToCart('${item.id}', '${item.name}', ${Number(item.price)})">Add to Cart</button>
        </div>
      `;
    }
  });
}

// Display category filter buttons
function displayCategoryFilter(items) {
  const categories = ['All', ...new Set(items.map(item => item.category))];
  const container = document.getElementById('category-filter');
  if (!container) return;
  container.innerHTML = '';
  categories.forEach(category => {
    const btn = document.createElement('button');
    btn.className = 'category-btn';
    btn.textContent = category;
    btn.onclick = () => filterByCategory(category);
    if (category === 'All') btn.classList.add('active');
    container.appendChild(btn);
  });
}

// Filter items by category
function filterByCategory(category) {
  const buttons = document.querySelectorAll('.category-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  buttons.forEach(btn => {
    if (btn.textContent === category) btn.classList.add('active');
  });
  // Use window.menuItems instead of menuItems
  const filteredItems = category === 'All' ? window.menuItems : window.menuItems.filter(item => item.category === category);
  displayAllItems(filteredItems);
}

// Display all items (or filtered by category)
function displayAllItems(items) {
  const container = document.getElementById('all-items');
  if (!container) return;
  container.innerHTML = '';
  if (items.length === 0) {
    container.innerHTML = '<p style="text-align: center;">No items in this category.</p>';
    return;
  }
  items.forEach(item => {
    if (item.id && item.name && item.price && item.description && item.imageUrl) {
      container.innerHTML += `
        <div class="food-card">
          <img src="${item.imageUrl}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/200'">
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          <p class="price">₹${Number(item.price).toFixed(0)}</p>
          <button onclick="addToCart('${item.id}', '${item.name}', ${Number(item.price)})">Add to Cart</button>
        </div>
      `;
    }
  });
}

// Add to cart
function addToCart(id, name, price, quantity = 1) {
  const existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ id, name, price: Number(price), quantity });
  }
  saveCart();
  updateCartCount();
  alert(`${name} added to cart!`);
  console.log('Cart updated:', cart);
}

// Remove from cart
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  displayCart();
  updateCartCount();
}

// Update quantity
function updateQuantity(id, change) {
  const item = cart.find(item => item.id === id);
  if (item) {
    item.quantity = Math.max(1, item.quantity + change);
    saveCart();
    displayCart();
    updateCartCount();
  }
}

// Save cart to localStorage
function saveCart() {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Cart saved to localStorage:', JSON.parse(localStorage.getItem('cart')));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
}

// Update cart count
function updateCartCount() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    cartCount.textContent = totalItems;
  }
}

// Display cart items
function displayCart() {
  const cartItems = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');
  const cartTotal = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (!cartItems || !cartEmpty || !cartTotal || !checkoutBtn) {
    console.error('Cart page elements not found. Ensure cart.html has correct IDs.');
    return;
  }

  console.log('Displaying cart with items:', cart);

  if (cart.length === 0) {
    cartItems.innerHTML = '';
    cartEmpty.style.display = 'block';
    cartTotal.style.display = 'none';
    checkoutBtn.style.display = 'none';
    return;
  }

  cartEmpty.style.display = 'none';
  cartTotal.style.display = 'block';
  checkoutBtn.style.display = 'block';

  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    if (item.id && item.name && item.price && item.quantity) {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      cartItems.innerHTML += `
        <div class="cart-item">
          <p>${item.name} - ₹${Number(item.price).toFixed(0)}</p>
          <div class="quantity">
            <button onclick="updateQuantity('${item.id}', -1)">-</button>
            <span>${item.quantity}</span>
            <button onclick="updateQuantity('${item.id}', 1)">+</button>
          </div>
          <p>₹${itemTotal.toFixed(0)}</p>
<button onclick="removeFromCart('${item.id}')" style="border: none; background: transparent; color: red; cursor: pointer;">
  <i class="fa fa-trash"></i>
</button>
        </div>
      `;
    } else {
      console.warn('Invalid cart item:', item);
    }
  });
  cartTotal.innerHTML = `Total: ₹${total.toFixed(0)}`;
}

// Handle checkout
function handleCheckout() {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert('Please login to proceed to checkout.');
    window.location.href = 'login.html';
    return;
  }
  const checkoutForm = document.getElementById('checkout-form');
  const cartSection = document.querySelector('.cart');
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  if (cartSection && checkoutForm) {
    cartSection.style.display = 'none';
    checkoutForm.style.display = 'block';
  } else {
    console.error('Checkout elements not found.');
  }
}

// Handle order submission
async function handleOrderSubmission() {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert('Please login to proceed.');
    window.location.href = 'login.html';
    return;
  }

  const name = document.getElementById('name');
  const address = document.getElementById('address');
  const phone = document.getElementById('phone');
  const checkoutForm = document.getElementById('checkout-form');
  const paymentSection = document.getElementById('payment-section');
  const paymentSummary = document.getElementById('payment-summary');
  const qrCode = document.getElementById('qr-code');

  if (!name || !address || !phone || !checkoutForm || !paymentSection || !paymentSummary || !qrCode) {
    console.error('Checkout or payment elements not found.');
    return;
  }

  if (!name.value || !address.value || !phone.value) {
    alert('Please fill in all fields.');
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const orderNumber = Math.floor(10000 + Math.random() * 90000); // Random 5-digit number
  const orderDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  window.chatState.orderData = {
    userId: user.uid,
    name: name.value,
    address: address.value,
    phone: phone.value,
    items: cart,
    total: Number(total.toFixed(0)),
    paymentMethod: window.chatState.paymentMethod,
    orderNumber: orderNumber,
    orderDate: orderDate,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Display payment summary in receipt format
  paymentSummary.innerHTML = `
    <div class="bill-header">
      <h3>Rasoi</h3>
      <p>Order Number: #${orderNumber}</p>
      <p>Date: ${orderDate}</p>
    </div>
    <table class="bill-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${cart.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${Number(item.price).toFixed(0)}</td>
            <td>₹${(item.price * item.quantity).toFixed(0)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="bill-footer">
      <p class="total">Grand Total: ₹${total.toFixed(0)}</p>
      <p class="thank-you">Thank You for dining with Rasoi!</p>
    </div>
  `;

  // Set dynamic QR code with UPI link
  const upiLink = `upi://pay?pa=Rasoi@bank&pn=Rasoi&am=${total.toFixed(0)}&cu=INR`;
  qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`;

  // Initialize payment method display
  updatePaymentMethodDisplay();

  // Show payment section
  checkoutForm.style.display = 'none';
  paymentSection.style.display = 'block';
}

// Update payment method display based on radio selection
function updatePaymentMethodDisplay() {
  const paymentQr = document.querySelector('.payment-qr');
  const paymentCard = document.querySelector('.payment-card');
  const cardError = document.getElementById('card-error');

  if (window.chatState.paymentMethod === 'upi') {
    paymentQr.style.display = 'block';
    paymentCard.style.display = 'none';
    cardError.style.display = 'none';
  } else {
    paymentQr.style.display = 'none';
    paymentCard.style.display = 'block';
  }
}

// Validate card inputs
function validateCardInputs() {
  const cardNumber = document.getElementById('card-number').value;
  const cardExpiry = document.getElementById('card-expiry').value;
  const cardCvv = document.getElementById('card-cvv').value;
  const cardError = document.getElementById('card-error');

  // Card Number: 16 digits
  if (!/^\d{16}$/.test(cardNumber)) {
    cardError.textContent = 'Invalid card number. Must be 16 digits.';
    cardError.style.display = 'block';
    return false;
  }

  // Expiry: MM/YY, MM 01-12, YY >= current year
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
    cardError.textContent = 'Invalid expiry date. Use MM/YY format (e.g., 12/25).';
    cardError.style.display = 'block';
    return false;
  }
  const [month, year] = cardExpiry.split('/').map(Number);
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    cardError.textContent = 'Card is expired.';
    cardError.style.display = 'block';
    return false;
  }

  // CVV: 3 digits
  if (!/^\d{3}$/.test(cardCvv)) {
    cardError.textContent = 'Invalid CVV. Must be 3 digits.';
    cardError.style.display = 'block';
    return false;
  }

  cardError.style.display = 'none';
  return true;
}

// Handle payment success
async function handlePaymentSuccess() {
  const paymentSection = document.getElementById('payment-section');
  const orderConfirmation = document.getElementById('order-confirmation');
  const confirmationMessage = document.getElementById('confirmation-message');

  if (!paymentSection || !orderConfirmation || !confirmationMessage) {
    console.error('Payment or confirmation elements not found.');
    return;
  }

  if (!window.chatState.orderData) {
    console.error('Order data not found.');
    alert('Order data missing. Please try again.');
    return;
  }

  if (window.chatState.paymentMethod === 'card' && !validateCardInputs()) {
    return;
  }

  try {
    await firebase.firestore().collection('orders').add(window.chatState.orderData);
    confirmationMessage.innerHTML = `
      Thank you, ${window.chatState.orderData.name}! Your order #${window.chatState.orderData.orderNumber} of ₹${window.chatState.orderData.total.toFixed(0)} will be delivered to ${window.chatState.orderData.address}.<br>
      We'll contact you at ${window.chatState.orderData.phone} for confirmation.
    `;
    paymentSection.style.display = 'none';
    orderConfirmation.style.display = 'block';

    // Clear cart after order
    cart = [];
    saveCart();
    updateCartCount();
  } catch (error) {
    console.error('Error submitting order to Firestore:', error);
    alert('Failed to submit order. Please try again later.');
  }
}

// Handle payment cancel
function handlePaymentCancel() {
  const paymentSection = document.getElementById('payment-section');
  const checkoutForm = document.getElementById('checkout-form');
  if (paymentSection && checkoutForm) {
    paymentSection.style.display = 'none';
    checkoutForm.style.display = 'block';
  } else {
    console.error('Payment or checkout elements not found.');
  }
}

// Initialize
function initialize() {
  // Firebase Auth state listener
  firebase.auth().onAuthStateChanged(user => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
          window.location.href = 'login.html';
        }).catch(error => {
          console.error('Error signing out:', error);
          alert('Failed to sign out. Please try again.');
        });
      });
    }
  });

  if (window.location.pathname.includes('cart.html')) {
    console.log('Initializing cart page');
    displayCart();
    const checkoutBtn = document.getElementById('checkout-btn');
    const submitOrder = document.getElementById('submit-order');
    const cancelCheckout = document.getElementById('cancel-checkout');
    const paymentSuccessBtn = document.getElementById('payment-success-btn');
    const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
    const paymentRadios = document.querySelectorAll('input[name="payment-method"]');

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', handleCheckout);
    } else {
      console.error('Checkout button not found.');
    }
    if (submitOrder) {
      submitOrder.addEventListener('click', handleOrderSubmission);
    } else {
      console.error('Submit order button not found.');
    }
    if (cancelCheckout) {
      cancelCheckout.addEventListener('click', () => {
        const checkoutForm = document.getElementById('checkout-form');
        const cartSection = document.querySelector('.cart');
        if (checkoutForm && cartSection) {
          checkoutForm.style.display = 'none';
          cartSection.style.display = 'block';
        }
      });
    } else {
      console.error('Cancel checkout button not found.');
    }
    if (paymentSuccessBtn) {
      paymentSuccessBtn.addEventListener('click', handlePaymentSuccess);
    } else {
      console.error('Payment success button not found.');
    }
    if (cancelPaymentBtn) {
      cancelPaymentBtn.addEventListener('click', handlePaymentCancel);
    } else {
      console.error('Cancel payment button not found.');
    }
    if (paymentRadios) {
      paymentRadios.forEach(radio => {
        radio.addEventListener('change', () => {
          window.chatState.paymentMethod = radio.value;
          updatePaymentMethodDisplay();
        });
      });
    } else {
      console.error('Payment radio buttons not found.');
    }
  }
  fetchMenuItems();
}




initialize();