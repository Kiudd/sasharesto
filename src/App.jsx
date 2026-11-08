import { useEffect, useMemo, useState } from "react";

const PRODUCTS = [
  {
    id: "sasha",
    name: "Kebab Sasha",
    price: 9.5,
    rating: 9.2,
    reviews: 128,
    category: "Kebabs",
    description:
      "Viande de veau et dinde rôtie à la broche, tranchée à la commande, pain maison et sauce à l’ail.",
    ingredients: ["Viande", "Salade", "Tomates", "Oignons", "Cornichons"],
    visual: "kebab",
  },
  {
    id: "assiette",
    name: "Assiette mixte",
    price: 13,
    rating: 9.6,
    reviews: 94,
    category: "Assiettes",
    description:
      "Poulet mariné, kefta et veau à la broche avec frites maison, riz safrané et crudités.",
    ingredients: ["Poulet", "Kefta", "Frites", "Riz", "Tomates", "Oignons rouges"],
    visual: "assiette",
  },
  {
    id: "durum",
    name: "Dürüm poulet",
    price: 8,
    rating: 8.1,
    reviews: 76,
    category: "Kebabs",
    description: "Poulet mariné au citron et au paprika roulé dans une galette fine grillée.",
    ingredients: ["Poulet", "Salade", "Tomates", "Oignons", "Fromage"],
    visual: "durum",
  },
  {
    id: "falafel",
    name: "Falafel wrap",
    price: 7.5,
    rating: 8.4,
    reviews: 52,
    category: "Végétarien",
    description: "Falafels croustillants, houmous, chou rouge mariné et tahini citronné.",
    ingredients: ["Falafels", "Houmous", "Chou rouge", "Persil", "Tahini"],
    visual: "falafel",
  },
  {
    id: "frites",
    name: "Frites maison",
    price: 4,
    rating: 7.8,
    reviews: 210,
    category: "Accompagnements",
    description: "Pommes de terre coupées à la main, frites deux fois, sel d’épices maison.",
    ingredients: ["Sel d’épices", "Persil"],
    visual: "frites",
  },
  {
    id: "baklava",
    name: "Baklava au miel",
    price: 3.5,
    rating: 9,
    reviews: 41,
    category: "Desserts",
    description: "Feuilletés fins, pistaches concassées et miel de fleurs.",
    ingredients: ["Pistaches", "Miel"],
    visual: "baklava",
  },
];

const SAUCES = ["Blanche", "Algérienne", "Harissa", "Samouraï", "Sans sauce"];
const CATEGORIES = ["Tous", "Kebabs", "Assiettes", "Végétarien", "Accompagnements", "Desserts"];
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const HOURS = [
  [11, 23],
  [11, 23],
  [11, 23],
  [11, 23],
  [11, 23],
  [11, 25],
  [11, 25],
];

const euro = (amount) =>
  `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function getOpeningStatus(date) {
  const day = date.getDay();
  const hour = date.getHours() + date.getMinutes() / 60;
  const closing = HOURS[day][1];
  const previousClosing = HOURS[(day + 6) % 7][1] - 24;
  const isOpen = (hour >= HOURS[day][0] && hour < closing) || (previousClosing > 0 && hour < previousClosing);

  return isOpen ? "Ouvert maintenant" : "Fermé · ouvre à 11 h";
}

function FoodVisual({ product, removed = [], className = "" }) {
  return (
    <div className={`food-plate ${className}`} aria-hidden="true">
      <div className={`food food--${product.visual}`}>
        {product.ingredients.map((ingredient, index) => (
          <span
            className={`food-detail food-detail--${index}${removed.includes(ingredient) ? " is-removed" : ""}`}
            key={ingredient}
          />
        ))}
      </div>
    </div>
  );
}

function Rating({ rating }) {
  const stars = Math.round(rating / 2);
  return (
    <span className="rating" aria-label={`Note ${rating.toFixed(1)} sur 10`}>
      {"★".repeat(stars)}
      {"☆".repeat(5 - stars)}
    </span>
  );
}

function Quantity({ value, onChange, label = "Quantité" }) {
  return (
    <div className="quantity" aria-label={label}>
      <button type="button" aria-label="Diminuer la quantité" onClick={() => onChange(Math.max(1, value - 1))}>
        −
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label="Augmenter la quantité" onClick={() => onChange(Math.min(20, value + 1))}>
        +
      </button>
    </div>
  );
}

function App() {
  const [selectedId, setSelectedId] = useState(PRODUCTS[0].id);
  const [quantity, setQuantity] = useState(1);
  const [sauce, setSauce] = useState(SAUCES[0]);
  const [removedByProduct, setRemovedByProduct] = useState({});
  const [category, setCategory] = useState("Tous");
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("Sur place");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [toast, setToast] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [now, setNow] = useState(() => new Date());

  const selectedProduct = PRODUCTS.find((product) => product.id === selectedId);
  const removed = removedByProduct[selectedId] ?? [];
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + PRODUCTS.find((product) => product.id === item.productId).price * item.quantity,
    0,
  );
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const deliveryFee = orderType === "Livraison" && subtotal > 0 && subtotal < 25 ? 3 : 0;
  const total = subtotal - discount + deliveryFee;
  const visibleProducts = useMemo(
    () => PRODUCTS.filter((product) => category === "Tous" || product.category === category),
    [category],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("cart-open", cartOpen);
    return () => document.body.classList.remove("cart-open");
  }, [cartOpen]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 1_800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setCartOpen(false);
        setDialogOpen(false);
      }
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
      if (event.key === "ArrowRight") {
        const index = PRODUCTS.findIndex((product) => product.id === selectedId);
        chooseProduct(PRODUCTS[(index + 1) % PRODUCTS.length].id);
      }
      if (event.key === "ArrowLeft") {
        const index = PRODUCTS.findIndex((product) => product.id === selectedId);
        chooseProduct(PRODUCTS[(index - 1 + PRODUCTS.length) % PRODUCTS.length].id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  function chooseProduct(id) {
    if (id === selectedId) return;
    setSelectedId(id);
    setQuantity(1);
  }

  function addToCart(item) {
    const normalizedRemoved = [...item.removed].sort();
    const matchingItem = cart.find(
      (cartItem) =>
        cartItem.productId === item.productId &&
        cartItem.sauce === item.sauce &&
        JSON.stringify([...cartItem.removed].sort()) === JSON.stringify(normalizedRemoved),
    );
    if (matchingItem) {
      setCart((items) =>
        items.map((cartItem) =>
          cartItem === matchingItem
            ? { ...cartItem, quantity: Math.min(20, cartItem.quantity + item.quantity) }
            : cartItem,
        ),
      );
    } else {
      setCart((items) => [...items, { ...item, removed: normalizedRemoved }]);
    }
    setToast(`${PRODUCTS.find((product) => product.id === item.productId).name} ajouté au panier`);
  }

  function updateCartQuantity(index, nextQuantity) {
    setCart((items) =>
      nextQuantity < 1
        ? items.filter((_, itemIndex) => itemIndex !== index)
        : items.map((item, itemIndex) =>
            itemIndex === index ? { ...item, quantity: Math.min(20, nextQuantity) } : item,
          ),
    );
  }

  function applyPromo() {
    const valid = promoCode.trim().toUpperCase() === "SASHA10";
    setPromoApplied(valid);
    setToast(valid ? "Code appliqué : −10 %" : "Code promo inconnu");
  }

  function submitOrder() {
    const preparationTime = { "Sur place": 10, "À emporter": 15, Livraison: 35 }[orderType];
    const orderNumber = Math.floor(100 + Math.random() * 900);
    setOrderMessage(
      `Commande n°${orderNumber} · ${orderType.toLowerCase()} · ${euro(total)}. Prête dans environ ${preparationTime} minutes.`,
    );
    setCartOpen(false);
    setDialogOpen(true);
  }

  function startNewOrder() {
    setCart([]);
    setPromoApplied(false);
    setPromoCode("");
    setDialogOpen(false);
  }

  const openCart = () => setCartOpen(true);
  const closeOverlays = () => {
    setCartOpen(false);
    setDialogOpen(false);
  };

  return (
    <>
      <header className="topbar">
        <a className="logo" href="#top" aria-label="Sasha Kebab, accueil">
          Sasha <small>KEBAB</small>
        </a>
        <nav className="nav-links" aria-label="Navigation principale">
          <a href="#top">Composer</a>
          <a href="#menu">Menu</a>
          <a href="#infos">Horaires</a>
        </nav>
        <span className={`status${getOpeningStatus(now) === "Ouvert maintenant" ? " is-open" : ""}`}>
          {getOpeningStatus(now)}
        </span>
        <button className="cart-button" type="button" onClick={openCart}>
          Panier
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </button>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="product-name">
          <div className="composer">
            <h1 id="product-name">{selectedProduct.name}</h1>
            <p className="description">{selectedProduct.description}</p>
            <div className="product-meta">
              <Rating rating={selectedProduct.rating} />
              <span>
                {selectedProduct.rating.toFixed(1).replace(".", ",")} · {selectedProduct.reviews} avis
              </span>
            </div>

            <p className="field-label">Touchez un ingrédient pour le retirer</p>
            <div className="chips">
              {selectedProduct.ingredients.map((ingredient) => {
                const isIncluded = !removed.includes(ingredient);
                return (
                  <button
                    className={`chip ingredient${isIncluded ? "" : " is-removed"}`}
                    type="button"
                    aria-pressed={isIncluded}
                    key={ingredient}
                    onClick={() =>
                      setRemovedByProduct((current) => ({
                        ...current,
                        [selectedId]: isIncluded
                          ? [...(current[selectedId] ?? []), ingredient]
                          : (current[selectedId] ?? []).filter((item) => item !== ingredient),
                      }))
                    }
                  >
                    {ingredient}
                  </button>
                );
              })}
            </div>

            <p className="field-label">Sauce</p>
            <div className="chips">
              {SAUCES.map((option) => (
                <button
                  className={`chip sauce${sauce === option ? " is-selected" : ""}`}
                  type="button"
                  aria-pressed={sauce === option}
                  key={option}
                  onClick={() => setSauce(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="buy-row">
              <Quantity value={quantity} onChange={setQuantity} />
              <span className="price">{euro(selectedProduct.price * quantity)}</span>
              <button
                className="primary-button add-button"
                type="button"
                onClick={() =>
                  addToCart({
                    productId: selectedId,
                    sauce,
                    removed,
                    quantity,
                  })
                }
              >
                Ajouter au panier
              </button>
            </div>
          </div>

          <div className="visual-column">
            <div className="hero-visual">
              <FoodVisual product={selectedProduct} removed={removed} className="hero-food" />
            </div>
            <div className="product-picker" aria-label="Choisir un plat">
              {PRODUCTS.map((product) => (
                <button
                  className={`picker-option${product.id === selectedId ? " is-active" : ""}`}
                  type="button"
                  aria-label={product.name}
                  aria-pressed={product.id === selectedId}
                  key={product.id}
                  onClick={() => chooseProduct(product.id)}
                >
                  <FoodVisual product={product} removed={removedByProduct[product.id] ?? []} />
                  <span>{product.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section menu-section" id="menu" aria-labelledby="menu-title">
          <h2 id="menu-title">Le menu</h2>
          <p className="section-subtitle">Tout est préparé à la commande. Chaque plat se personnalise.</p>
          <div className="filters" aria-label="Filtrer le menu">
            {CATEGORIES.map((item) => (
              <button
                className={`chip filter-chip${category === item ? " is-selected" : ""}`}
                type="button"
                aria-pressed={category === item}
                key={item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="menu-grid">
            {visibleProducts.map((product) => (
              <article className="menu-card" key={product.id}>
                <FoodVisual product={product} />
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="card-meta">
                  <strong>{euro(product.price)}</strong>
                  <Rating rating={product.rating} />
                </div>
                <div className="card-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      chooseProduct(product.id);
                      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
                    }}
                  >
                    Personnaliser
                  </button>
                  <button
                    className="quick-add"
                    type="button"
                    aria-label={`Ajouter ${product.name} au panier`}
                    onClick={() =>
                      addToCart({ productId: product.id, sauce: "Blanche", removed: [], quantity: 1 })
                    }
                  >
                    +
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section info-section" id="infos">
          <div className="info-grid">
            <div>
              <h2>Horaires</h2>
              <p className="section-subtitle">Ouvert tous les jours.</p>
              <table className="hours-table">
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                    const closing = HOURS[day][1] > 24 ? `${HOURS[day][1] - 24} h` : `${HOURS[day][1]} h`;
                    return (
                      <tr className={day === now.getDay() ? "is-today" : ""} key={day}>
                        <td>{DAYS[day]}</td>
                        <td>11 h – {closing}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <h2>Commander</h2>
              <p className="section-subtitle">Trois façons de profiter de Sasha.</p>
              <div className="service-list">
                <div className="service-card">
                  <strong>Sur place</strong>
                  <span>Prêt en 10 minutes environ.</span>
                </div>
                <div className="service-card">
                  <strong>À emporter</strong>
                  <span>Prêt en 15 minutes, sans attente au comptoir.</span>
                </div>
                <div className="service-card">
                  <strong>Livraison</strong>
                  <span>35 minutes environ. Offerte dès 25 €, sinon 3 €.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Sasha Kebab · 12 rue des Lilas</span>
        <span>Viande halal · Fait maison</span>
      </footer>

      {(cartOpen || dialogOpen) && <button className="overlay" type="button" aria-label="Fermer" onClick={closeOverlays} />}

      <aside className={`cart-drawer${cartOpen ? " is-open" : ""}`} aria-label="Panier">
        <header className="drawer-header">
          <h2>Votre panier</h2>
          <button className="close-button" type="button" aria-label="Fermer le panier" onClick={closeOverlays}>
            ×
          </button>
        </header>
        <div className="cart-lines">
          {cart.length === 0 ? (
            <p className="empty-cart">Votre panier est vide.<br />Choisissez un plat pour commencer.</p>
          ) : (
            cart.map((item, index) => {
              const product = PRODUCTS.find((entry) => entry.id === item.productId);
              const details = [
                item.sauce === "Sans sauce" ? "Sans sauce" : `Sauce ${item.sauce.toLowerCase()}`,
                item.removed.length > 0 ? `sans ${item.removed.map((ingredient) => ingredient.toLowerCase()).join(", ")}` : "",
              ].filter(Boolean).join(" · ");
              return (
                <div className="cart-line" key={`${item.productId}-${item.sauce}-${item.removed.join("-")}`}>
                  <FoodVisual product={product} removed={item.removed} />
                  <div className="cart-item-details">
                    <strong>{product.name}</strong>
                    <span>{details}</span>
                    <Quantity
                      label={`Quantité de ${product.name}`}
                      value={item.quantity}
                      onChange={(next) => updateCartQuantity(index, next)}
                    />
                  </div>
                  <div className="cart-item-price">
                    <strong>{euro(product.price * item.quantity)}</strong>
                    <button className="remove-button" type="button" onClick={() => updateCartQuantity(index, 0)}>
                      Retirer
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="order-types" aria-label="Mode de commande">
          {["Sur place", "À emporter", "Livraison"].map((type) => (
            <button
              type="button"
              aria-pressed={orderType === type}
              className={orderType === type ? "is-active" : ""}
              key={type}
              onClick={() => setOrderType(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <form
          className="promo-form"
          onSubmit={(event) => {
            event.preventDefault();
            applyPromo();
          }}
        >
          <input
            aria-label="Code promo"
            placeholder="Code promo"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
          />
          <button className="secondary-button" type="submit">Appliquer</button>
        </form>

        <div className="order-summary">
          <div><span>Sous-total</span><span>{euro(subtotal)}</span></div>
          {promoApplied && <div><span>Code SASHA10</span><span>−{euro(discount)}</span></div>}
          {orderType === "Livraison" && (
            <div><span>Livraison</span><span>{subtotal >= 25 ? "Offerte" : euro(deliveryFee)}</span></div>
          )}
          <div className="summary-total"><strong>Total</strong><strong>{euro(total)}</strong></div>
        </div>
        <button className="primary-button checkout-button" type="button" disabled={cart.length === 0} onClick={submitOrder}>
          Valider la commande
        </button>
      </aside>

      {dialogOpen && (
        <section className="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
          <div className="confirmation-icon" aria-hidden="true">✓</div>
          <h2 id="confirmation-title">Commande validée</h2>
          <p>{orderMessage}</p>
          <button className="primary-button checkout-button" type="button" onClick={startNewOrder}>
            Nouvelle commande
          </button>
        </section>
      )}

      <div className={`toast${toast ? " is-visible" : ""}`} role="status" aria-live="polite">{toast}</div>
    </>
  );
}

export default App;
