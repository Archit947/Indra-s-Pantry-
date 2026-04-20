import React from 'react';
import { Link } from 'react-router-dom';
import { Item } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './ItemCard.module.css';

interface Props {
  item: Item;
  onCategoryClick?: (category: NonNullable<Item['categories']>) => void;
}

const ItemCard: React.FC<Props> = ({ item, onCategoryClick }) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = React.useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent Link navigation
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!item.is_available) return;
    setAdding(true);
    try {
      await addItem(item.id, 1);
      toast.success(`${item.name} added to cart!`);
    } catch {
      toast.error('Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleCategoryClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.categories && onCategoryClick) {
      onCategoryClick(item.categories);
    }
  };

  return (
    <Link to={`/item/${item.id}`} className={styles.card}>
      {/* Image */}
      <div className={styles.imgWrap}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className={styles.img} loading="lazy" />
        ) : (
          <div className={styles.imgPlaceholder}>🍛</div>
        )}
        {!item.is_available && (
          <div className={styles.outBadge}>Out of Stock</div>
        )}
        {item.categories && (
          <button type="button" className={styles.catBadge} onClick={handleCategoryClick}>
            {item.categories.name}
          </button>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <h3 className={styles.name}>{item.name}</h3>
        {item.description && (
          <p className={styles.desc}>{item.description}</p>
        )}
        <div className={styles.footer}>
          <span className={styles.price}>₹{item.price}</span>
          <button
            className={`btn btn-primary btn-sm ${styles.addBtn}`}
            onClick={handleAddToCart}
            disabled={!item.is_available || adding}
          >
            {adding ? '…' : '+ Add'}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
