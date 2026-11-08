import { useEffect, useMemo, useRef, useState } from "react";

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
    ingredients: ["Viande", "Salade", "Tomates", "Oignons", "Cornichons", "Bacon", "Oignon frit", "Fromage"],
    visual: "kebab",
  },
  {
    id: "frites",
    name: "Frites maison",
    price: 4,
    rating: 7.8,
    reviews: 210,
    category: "Accompagnements",
    description: "Pommes de terre coupées à la main, frites deux fois, sel d’épices maison.",
    ingredients: ["Fromage", "Bacon", "Oignon frit"],
    visual: "frites",
  },
];

const SAUCES = ["Blanche", "Algérienne", "Harissa", "Samouraï", "Sans sauce"];
const CATEGORIES = ["Tous", "Kebabs", "Accompagnements"];
const KEBAB_OPTION_CODES = [
  ["Salade", "S"],
  ["Tomates", "T"],
  ["Oignons", "O"],
  ["Cornichons", "C"],
  ["Bacon", "B"],
  ["Oignon frit", "R"],
  ["Fromage", "F"],
];
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
const FOOD_LAYOUTS = {
  kebab: [[28, 33], [67, 29], [53, 61], [28, 66], [73, 65], [48, 43], [75, 48], [42, 76]],
  assiette: [[28, 32], [47, 42], [72, 63], [27, 70], [70, 32], [48, 73]],
  durum: [[48, 30], [33, 54], [68, 51], [48, 72], [52, 48]],
  falafel: [[30, 34], [67, 34], [51, 65], [28, 70], [72, 69]],
  frites: [[50, 50]],
  baklava: [[37, 39], [62, 61]],
};

const euro = (amount) =>
  `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

const ingredientClass = (ingredient) =>
  ingredient
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function getFriesImage(ingredients, removed) {
  const selected = new Set(ingredients.filter((ingredient) => !removed.includes(ingredient)).map(ingredientClass));
  const cheese = selected.has("fromage");
  const bacon = selected.has("bacon");
  const onion = selected.has("oignon-frit");
  const variant = (src, offset = "0%") => ({ src: `/images/food/ingredients/${src}`, offset });

  if (cheese && bacon && onion) return variant("frites-cheddar-bacon-oignon.png", "-5%");
  if (cheese && bacon) return variant("frites-cheddar-bacon.png", "-4%");
  if (cheese && onion) return variant("frites-cheddar-oignon.png", "-5%");
  if (cheese) return variant("frites-cheddar.png");
  if (bacon && onion) return variant("frites-bacon-oignon.png", "-5%");
  if (bacon) return variant("frites-bacon.png", "-5%");
  if (onion) return variant("frites-oignon.png", "-5%");
  return variant("frite.png");
}

function getKebabImage(ingredients, removed) {
  const mask = KEBAB_OPTION_CODES.reduce(
    (value, [ingredient]) => (value << 1) | (ingredients.includes(ingredient) && !removed.includes(ingredient) ? 1 : 0),
    0,
  );
  const code = `V${KEBAB_OPTION_CODES
    .filter(([ingredient]) => ingredients.includes(ingredient) && !removed.includes(ingredient))
    .map(([, letter]) => letter)
    .join("")}`;
  const number = String(128 - mask).padStart(3, "0");
  return `/images/food/dishes/kebab-sasha/wrap_${number}_${code}.png`;
}

function getOpeningStatus(date) {
  const day = date.getDay();
  const hour = date.getHours() + date.getMinutes() / 60;
  const closing = HOURS[day][1];
  const previousClosing = HOURS[(day + 6) % 7][1] - 24;
  const isOpen = (hour >= HOURS[day][0] && hour < closing) || (previousClosing > 0 && hour < previousClosing);

  return isOpen ? "Ouvert maintenant" : "Fermé · ouvre à 11 h";
}

function FoodVisual({ product, removed = [], className = "" }) {
  const kebabImage = product.id === "sasha" ? getKebabImage(product.ingredients, removed) : null;
  const friesImage = product.id === "frites" ? getFriesImage(product.ingredients, removed) : null;
  const variantImage = kebabImage ?? friesImage?.src;
  const visibleIngredients = product.id === "frites" || product.id === "sasha" ? [] : product.ingredients;

  return (
    <div className={`food-plate ${className}`} aria-hidden="true">
      <img className="plate-image" src="/images/food/plate/H_M-removebg-preview.png" alt="" />
      <div className={`food food--${product.visual}`}>
        {variantImage ? (
          <img
            className={`food-base food-base--${product.visual}${friesImage ? " is-fries-variant" : " is-kebab-variant"}`}
            key={variantImage}
            src={variantImage}
            alt=""
            style={friesImage ? { "--fries-offset": friesImage.offset } : undefined}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = kebabImage
                ? "/images/food/dishes/kebab-sasha/wrap_128_V.png"
                : "/images/food/ingredients/frite.png";
            }}
          />
        ) : (
          <span className={`food-base food-base--${product.visual}`} />
        )}
        <div className="food-ingredients">
          {visibleIngredients.map((ingredient, index) => {
            const [left, top] = FOOD_LAYOUTS[product.visual][index];
            return (
              <span
                className={`food-detail ingredient-${ingredientClass(ingredient)}${removed.includes(ingredient) ? " is-removed" : ""}`}
                data-ingredient={ingredient}
                key={ingredient}
                style={{ left: `${left}%`, top: `${top}%` }}
              />
            );
          })}
        </div>
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
  const [changeAnimation, setChangeAnimation] = useState(null);
  const swipeStartX = useRef(null);
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
      if (event.key === "ArrowRight") moveProduct(1);
      if (event.key === "ArrowLeft") moveProduct(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  function chooseProduct(id, direction) {
    if (id === selectedId) return;
    const currentIndex = PRODUCTS.findIndex((product) => product.id === selectedId);
    const nextIndex = PRODUCTS.findIndex((product) => product.id === id);
    setChangeAnimation({
      direction: direction ? (direction > 0 ? "next" : "previous") : nextIndex > currentIndex ? "next" : "previous",
      key: (changeAnimation?.key ?? 0) + 1,
    });
    setSelectedId(id);
    setQuantity(1);
  }

  function moveProduct(direction) {
    const index = PRODUCTS.findIndex((product) => product.id === selectedId);
    const nextIndex = (index + direction + PRODUCTS.length) % PRODUCTS.length;
    chooseProduct(PRODUCTS[nextIndex].id, direction);
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
            <h1 id="product-name" className={changeAnimation ? `product-copy is-${changeAnimation.direction}` : ""}>
              {selectedProduct.name}
            </h1>
            <p className={`description${changeAnimation ? ` product-copy is-${changeAnimation.direction}` : ""}`}>
              {selectedProduct.description}
            </p>
            <div className={`product-meta${changeAnimation ? ` product-copy is-${changeAnimation.direction}` : ""}`}>
              <Rating rating={selectedProduct.rating} />
              <span>
                {selectedProduct.rating.toFixed(1).replace(".", ",")} · {selectedProduct.reviews} avis
              </span>
            </div>

            <p className="field-label">Touchez un ingrédient pour le retirer</p>
            <div className="chips">
              {selectedProduct.ingredients.map((ingredient) => {
                if (selectedId === "sasha" && ingredient === "Viande") {
                  return <span className="chip ingredient ingredient-fixed" key={ingredient}>{ingredient}</span>;
                }
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
            <div
              className="hero-visual"
              onPointerDown={(event) => {
                if (event.target.closest("button")) return;
                swipeStartX.current = event.clientX;
              }}
              onPointerUp={(event) => {
                if (swipeStartX.current === null) return;
                const swipeDistance = event.clientX - swipeStartX.current;
                if (Math.abs(swipeDistance) > 45) moveProduct(swipeDistance < 0 ? 1 : -1);
                swipeStartX.current = null;
              }}
              onPointerCancel={() => {
                swipeStartX.current = null;
              }}
            >
              <button
                className="visual-arrow visual-arrow--previous"
                type="button"
                aria-label="Plat précédent"
                onClick={() => moveProduct(-1)}
              >
                ←
              </button>
              <FoodVisual
                key={`${selectedId}-${changeAnimation?.key ?? 0}`}
                product={selectedProduct}
                removed={removed}
                className={`hero-food${changeAnimation ? ` is-changing is-${changeAnimation.direction}` : ""}`}
              />
              <button
                className="visual-arrow visual-arrow--next"
                type="button"
                aria-label="Plat suivant"
                onClick={() => moveProduct(1)}
              >
                →
              </button>
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
