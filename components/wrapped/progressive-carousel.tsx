"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type FC,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressSliderContextType {
  active: string;
  progress: number;
  handleButtonClick: (value: string) => void;
  goToNext: () => void;
  goToPrev: () => void;
  sliderValues: string[];
}

interface ProgressSliderProps {
  children: ReactNode;
  duration?: number;
  fastDuration?: number;
  activeSlider: string;
  className?: string;
  onSlideChange?: (value: string) => void;
}

interface SliderContentProps {
  children: ReactNode;
  className?: string;
}

interface SliderWrapperProps {
  children: ReactNode;
  value: string;
  className?: string;
}

interface SliderIndicatorProps {
  className?: string;
}

const ProgressSliderContext = createContext<ProgressSliderContextType | undefined>(
  undefined
);

export const useProgressSliderContext = (): ProgressSliderContextType => {
  const context = useContext(ProgressSliderContext);
  if (!context) {
    throw new Error(
      "useProgressSliderContext must be used within a ProgressSlider"
    );
  }
  return context;
};

export const ProgressSlider: FC<ProgressSliderProps> = ({
  children,
  duration = 6000,
  fastDuration = 400,
  activeSlider,
  className,
  onSlideChange,
}) => {
  const [active, setActive] = useState<string>(activeSlider);
  const [progress, setProgress] = useState<number>(0);
  const [sliderValues, setSliderValues] = useState<string[]>([]);

  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isFastForwardRef = useRef<boolean>(false);
  const targetValueRef = useRef<string | null>(null);
  const startProgressRef = useRef<number>(0);

  useEffect(() => {
    const getChildren = React.Children.toArray(children).find(
      (child) =>
        (child as React.ReactElement<SliderContentProps>).type === SliderContent
    ) as React.ReactElement<SliderContentProps> | undefined;

    if (getChildren) {
      const values = React.Children.toArray(getChildren.props.children).map(
        (child) =>
          (child as React.ReactElement<SliderWrapperProps>).props.value as string
      );
      setSliderValues(values);
    }
  }, [children]);

  const goToSlide = useCallback(
    (newValue: string) => {
      setActive(newValue);
      onSlideChange?.(newValue);
      setProgress(0);
      startTimeRef.current = performance.now();
      startProgressRef.current = 0;
      isFastForwardRef.current = false;
      targetValueRef.current = null;
    },
    [onSlideChange]
  );

  const animate = useCallback(
    (now: number) => {
      const currentDuration = isFastForwardRef.current ? fastDuration : duration;
      const elapsed = now - startTimeRef.current;
      const timeFraction = Math.min(elapsed / currentDuration, 1);

      if (isFastForwardRef.current) {
        const newProgress =
          startProgressRef.current +
          (100 - startProgressRef.current) * timeFraction;
        setProgress(newProgress);
      } else {
        setProgress(timeFraction * 100);
      }

      if (timeFraction < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        if (isFastForwardRef.current && targetValueRef.current) {
          goToSlide(targetValueRef.current);
        } else if (!isFastForwardRef.current) {
          setActive((currentActive) => {
            const currentIndex = sliderValues.indexOf(currentActive);
            const nextIndex = (currentIndex + 1) % sliderValues.length;
            const newValue = sliderValues[nextIndex];
            onSlideChange?.(newValue);
            return newValue;
          });
          setProgress(0);
          startTimeRef.current = performance.now();
        }
        frameRef.current = requestAnimationFrame(animate);
      }
    },
    [duration, fastDuration, sliderValues, onSlideChange, goToSlide]
  );

  useEffect(() => {
    if (sliderValues.length > 0) {
      startTimeRef.current = performance.now();
      frameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [sliderValues, animate]);

  const handleButtonClick = useCallback(
    (value: string) => {
      setActive((currentActive) => {
        if (value !== currentActive) {
          startProgressRef.current = progress;
          targetValueRef.current = value;
          isFastForwardRef.current = true;
          startTimeRef.current = performance.now();
        }
        return currentActive;
      });
    },
    [progress]
  );

  const goToNext = useCallback(() => {
    const currentIndex = sliderValues.indexOf(active);
    const nextIndex = (currentIndex + 1) % sliderValues.length;
    if (sliderValues[nextIndex]) {
      goToSlide(sliderValues[nextIndex]);
    }
  }, [active, sliderValues, goToSlide]);

  const goToPrev = useCallback(() => {
    const currentIndex = sliderValues.indexOf(active);
    const prevIndex =
      currentIndex === 0 ? sliderValues.length - 1 : currentIndex - 1;
    if (sliderValues[prevIndex]) {
      goToSlide(sliderValues[prevIndex]);
    }
  }, [active, sliderValues, goToSlide]);

  return (
    <ProgressSliderContext.Provider
      value={{
        active,
        progress,
        handleButtonClick,
        goToNext,
        goToPrev,
        sliderValues,
      }}
    >
      <div className={cn("relative", className)}>{children}</div>
    </ProgressSliderContext.Provider>
  );
};

export const SliderContent: FC<SliderContentProps> = ({ children, className }) => {
  return <div className={cn("", className)}>{children}</div>;
};

export const SliderWrapper: FC<SliderWrapperProps> = ({
  children,
  value,
  className,
}) => {
  const { active } = useProgressSliderContext();

  return (
    <AnimatePresence mode="popLayout">
      {active === value && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn("", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SliderIndicator: FC<SliderIndicatorProps> = ({ className }) => {
  const { active, progress, sliderValues, handleButtonClick } =
    useProgressSliderContext();

  return (
    <div className={cn("flex gap-1", className)}>
      {sliderValues.map((value) => {
        const isActive = active === value;
        const currentIndex = sliderValues.indexOf(active);
        const valueIndex = sliderValues.indexOf(value);
        const isPast = valueIndex < currentIndex;

        return (
          <button
            type="button"
            key={value}
            onClick={() => handleButtonClick(value)}
            className="h-1 flex-1 rounded-full overflow-hidden bg-foreground/20 transition-all"
          >
            <div
              className="h-full bg-brand-accent"
              style={{
                width: isPast ? "100%" : isActive ? `${progress}%` : "0%",
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

export const SliderNavigation: FC<{ className?: string }> = ({ className }) => {
  const { goToNext, goToPrev } = useProgressSliderContext();

  return (
    <div className={cn("absolute inset-0 flex pointer-events-none", className)}>
      <button
        type="button"
        onClick={goToPrev}
        className="w-1/3 h-full cursor-pointer pointer-events-auto"
        aria-label="Previous slide"
      />
      <div className="w-1/3" />
      <button
        type="button"
        onClick={goToNext}
        className="w-1/3 h-full cursor-pointer pointer-events-auto"
        aria-label="Next slide"
      />
    </div>
  );
};

