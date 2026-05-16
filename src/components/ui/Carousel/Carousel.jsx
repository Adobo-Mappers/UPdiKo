import './Carousel.css'
import { useEffect, useState } from 'react';
import { Icon } from './../index';

export function Carousel({ imageUrls = [] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideCount = imageUrls.length;

  useEffect(() => {
    if (currentSlide >= slideCount) {
      setCurrentSlide(0);
    }
  }, [currentSlide, slideCount]);

  function moveBy(index) {
    if (slideCount === 0) return;
    setCurrentSlide((prev) => (prev + index + slideCount) % slideCount);
  };

  if (slideCount === 0) {
    return null;
  }

  return (
    <div className="carousel">
      <div className="slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {imageUrls.map((image, index) => (
          <img
            className="slide"
            src={image}
            alt={`Slide ${index + 1}`}
            key={index}
          />
        ))}
      </div>

      {imageUrls.length > 1 && 
        (<div className="buttons">
          <button type="button" onClick={() => moveBy(-1)} aria-label="Previous slide">
            <Icon className='prev-button' name="back" size="small"/>
          </button>
          <button type="button" onClick={() => moveBy(1)} aria-label="Next slide">
            <Icon className='next-button' name="back" size="small"/>
          </button>
        </div>
        )
      }
    
      {imageUrls.length > 1 && 
       (<div className="dots">
           {imageUrls.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        )
      }

    </div>
  );
}