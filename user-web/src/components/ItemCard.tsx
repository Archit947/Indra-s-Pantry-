import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Item } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import styles from './ItemCard.module.css';

interface Props {
  item: Item;
  onCategoryClick?: (category: NonNullable<Item['categories']>) => void;
  categoryDescription?: string;
}

const ItemCard: React.FC<Props> = ({ item, onCategoryClick, categoryDescription }) => {
  const { addItem, cartItems, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [updating, setUpdating] = React.useState(false);

  const cartItem = cartItems.find((ci) => ci.item_id === item.id);
  const quantity = cartItem?.quantity ?? 0;
  const canOrder = item.is_available && item.stock > 0;
  const maxReached = canOrder && quantity >= item.stock;

  const ensureAuthenticated = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleIncrement = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!ensureAuthenticated() || !canOrder || updating || maxReached) return;

    setUpdating(true);
    try {
      if (cartItem) {
        await updateQuantity(cartItem.id, cartItem.quantity + 1);
      } else {
        await addItem(item.id, 1);
      }
    } catch {
      toast.error('Could not update cart');
    } finally {
      setUpdating(false);
    }
  };

  const handleDecrement = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!ensureAuthenticated() || !cartItem || updating) return;

    setUpdating(true);
    try {
      if (cartItem.quantity <= 1) {
        await removeItem(cartItem.id);
      } else {
        await updateQuantity(cartItem.id, cartItem.quantity - 1);
      }
    } catch {
      toast.error('Could not update cart');
    } finally {
      setUpdating(false);
    }
  };

  const handleCategoryClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.categories && onCategoryClick) {
      onCategoryClick(item.categories);
    }
  };

  const cardDescription = (categoryDescription ?? item.description ?? '').trim();

  return (
    <Link to={`/item/${item.id}`} className={styles.card}>
      <div className={styles.imgWrap}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className={styles.img} loading="lazy" />
        ) : (
          <div className={styles.imgPlaceholder}>Item</div>
        )}

        {!canOrder && <div className={styles.outBadge}>Out of Stock</div>}

        {item.categories && (
          <button type="button" className={styles.catBadge} onClick={handleCategoryClick}>
            {item.categories.name}
          </button>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{item.name}</h3>
        {cardDescription && <p className={styles.desc}>{cardDescription}</p>}
        {canOrder && item.stock <= 5 && <p className={styles.stockHint}>Only {item.stock} left</p>}

        <div className={styles.footer}>
          <span className={styles.price}>Rs {item.price}</span>

          {quantity === 0 ? (
            <button
              className={`btn btn-primary btn-sm ${styles.addBtn}`}
              onClick={handleIncrement}
              disabled={!canOrder || updating}
            >
              {updating ? '...' : '+ Add'}
            </button>
          ) : (
            <div className={styles.qtyControls}>
              <button
                type="button"
                className={styles.qtyBtn}
                onClick={handleDecrement}
                disabled={updating}
                aria-label={`Decrease ${item.name} quantity`}
              >
                -
              </button>
              <span className={styles.qtyValue}>{quantity}</span>
              <button
                type="button"
                className={styles.qtyBtn}
                onClick={handleIncrement}
                disabled={updating || !canOrder || maxReached}
                aria-label={`Increase ${item.name} quantity`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
