import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const mainImage = product.images && product.images.length > 0 
    ? (product.images[0].url || product.images[0])
    : 'https://via.placeholder.com/300x300?text=No+Image';

  const displayPrice = product.onSale && product.salePercentage
    ? (product.price * (1 - product.salePercentage / 100)).toFixed(2)
    : product.price?.toFixed(2);

  return (
    <Link 
      to={`/products/${product._id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-64 object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
          }}
        />
        {product.onSale && (
          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
            {product.salePercentage}% OFF
          </span>
        )}
        {product.featured && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded text-sm font-semibold">
            Featured
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">
              ${displayPrice}
            </span>
            {product.onSale && product.compareAtPrice && (
              <span className="text-gray-400 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          {product.ratings > 0 && (
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600 ml-1">
                {product.ratings.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded">
            {product.category}
          </span>
          {product.stock > 0 && (
            <span className={product.stock < 10 ? 'text-orange-500' : 'text-green-500'}>
              {product.stock} in stock
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;


