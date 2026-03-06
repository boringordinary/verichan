import { forwardRef, useCallback, useRef } from "react";
import {
	Slider as AriaSlider,
	Label,
	SliderOutput,
	SliderThumb,
	SliderTrack,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { hapticConfirm } from "../../utils/haptics";

const sliderStyles = tv({
	slots: {
		root: [
			"relative",
			"w-full",
			"flex",
			"flex-col",
			"gap-2",
			"touch-none",
			"select-none",
		],
		label: ["text-sm", "font-medium", "text-foreground"],
		valueText: ["text-sm", "text-muted-foreground"],
		trackContainer: [
			"relative",
			"flex",
			"items-center",
			"h-6",
			"cursor-pointer",
			"group",
		],
		track: [
			"relative",
			"w-full",
			"h-1",
			"bg-primary/33",
			"rounded-full",
			"overflow-hidden",
			"group-hover:h-1.5",
			"transition-[height]",
			"duration-150",
		],
		range: [
			"absolute",
			"h-full",
			"bg-primary",
			"rounded-full",
			"pointer-events-none",
		],
		thumb: [
			"top-1/2",
			"w-3",
			"h-3",
			"rounded-full",
			"bg-white",
			"shadow-lg",
			"pointer-events-auto",
			"opacity-0",
			"scale-0",
			"group-hover:opacity-100",
			"group-hover:scale-110",
			"group-focus-within:opacity-100",
			"group-focus-within:scale-110",
			"transition-[opacity,transform]",
			"duration-150",
			"outline-none",
		],
	},
	variants: {
		variant: {
			default: {},
			minimal: {
				root: ["gap-1"],
				trackContainer: ["h-3"],
				track: ["h-0.5", "bg-primary/33", "group-hover:h-1"],
				range: ["bg-primary/80"],
				thumb: [
					"w-2.5",
					"h-2.5",
					"bg-primary",
					"shadow-sm",
					"group-hover:scale-125",
					"group-focus-within:scale-125",
				],
			},
			miniplayer: {
				root: ["gap-0", "overflow-visible"],
				trackContainer: ["h-8", "overflow-visible"],
				track: ["h-1", "bg-primary/33", "group-hover:h-1.5"],
				range: ["bg-primary/80"],
				thumb: [
					"w-4",
					"h-4",
					"rounded-full",
					"bg-primary",
					"shadow-lg",
					"shadow-primary/25",
					"ring-1",
					"ring-primary/30",
					"opacity-0",
					"scale-90",
					"transition-[opacity,transform]",
					"duration-200",
					"ease-out",
				],
			},
		},
		orientation: {
			horizontal: {},
			vertical: {
				trackContainer: "h-48 w-6 justify-center",
				track: "h-full w-1 group-hover:w-1.5 group-hover:h-full",
				range: "bottom-0 w-full",
				thumb: "left-1/2 -translate-x-1/2",
			},
		},
	},
	defaultVariants: {
		variant: "default",
		orientation: "horizontal",
	},
});

interface SliderProps {
	min?: number;
	max?: number;
	value?: number | number[];
	defaultValue?: number | number[];
	step?: number;
	label?: string;
	ariaLabel?: string;
	showValue?: boolean;
	variant?: "default" | "minimal" | "miniplayer";
	orientation?: "horizontal" | "vertical";
	disabled?: boolean;
	onValueChange?: (details: { value: number[] }) => void;
	onValueChangeStart?: () => void;
	onValueChangeEnd?: (details: { value: number[] }) => void;
	className?: string;
	showThumb?: boolean;
	name?: string;
	id?: string;
}

const toArrayValue = (
	value: number | number[] | undefined,
	fallback: number,
) => {
	if (Array.isArray(value)) {
		return value;
	}
	if (typeof value === "number") {
		return [value];
	}
	return [fallback];
};

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
	(
		{
			min = 0,
			max = 100,
			value,
			defaultValue = [0],
			step = 1,
			label,
			ariaLabel,
			showValue = false,
			variant = "default",
			orientation = "horizontal",
			disabled = false,
			onValueChange,
			onValueChangeStart,
			onValueChangeEnd,
			className,
			showThumb = true,
			name,
			id,
		},
		ref,
	) => {
		const styles = sliderStyles({ variant, orientation });
		const isInteractingRef = useRef(false);
		const isControlled = value !== undefined;
		const controlledValue = toArrayValue(value, min)[0];
		const uncontrolledDefaultValue = toArrayValue(defaultValue, min)[0];

		const startInteraction = useCallback(() => {
			if (isInteractingRef.current) {
				return;
			}
			isInteractingRef.current = true;
			onValueChangeStart?.();
		}, [onValueChangeStart]);

		const handleChange = useCallback(
			(nextValue: number | number[]) => {
				startInteraction();
				const nextValues = Array.isArray(nextValue) ? nextValue : [nextValue];
				onValueChange?.({ value: nextValues });
			},
			[onValueChange, startInteraction],
		);

		const handleChangeEnd = useCallback(
			(nextValue: number | number[]) => {
				const nextValues = Array.isArray(nextValue) ? nextValue : [nextValue];
				if (isInteractingRef.current) {
					isInteractingRef.current = false;
					hapticConfirm();
				}
				onValueChangeEnd?.({ value: nextValues });
			},
			[onValueChangeEnd],
		);

		const shouldRenderThumb = variant === "miniplayer" ? true : showThumb;
		const miniplayerThumbVisible = variant !== "miniplayer" || showThumb;

		return (
			<AriaSlider
				ref={ref}
				id={id}
				aria-label={ariaLabel ?? label}
				className={`${styles.root()} ${className || ""}`}
				minValue={min}
				maxValue={max}
				step={step}
				isDisabled={disabled}
				orientation={orientation}
				value={isControlled ? controlledValue : undefined}
				defaultValue={isControlled ? undefined : uncontrolledDefaultValue}
				onChange={handleChange}
				onChangeEnd={handleChangeEnd}
			>
				{label ? <Label className={styles.label()}>{label}</Label> : null}
				{showValue ? (
					<SliderOutput className={styles.valueText()}>
						{({ state }) => state.values[0]}
					</SliderOutput>
				) : null}

				<SliderTrack
					className={styles.trackContainer()}
					onPointerDown={startInteraction}
					onMouseDown={startInteraction}
					onTouchStart={startInteraction}
				>
					{({ state }) => {
						const percent = state.getThumbPercent(0) * 100;
						const rangeStyle =
							orientation === "vertical"
								? ({ height: `${percent}%` } as const)
								: ({ width: `${percent}%` } as const);

						return (
							<>
								<div className={styles.track()}>
									<div className={styles.range()} style={rangeStyle} />
								</div>

								{shouldRenderThumb ? (
									<SliderThumb
										index={0}
										name={name || "slider-value"}
										className={({ isDragging }) =>
											`${styles.thumb()} ${variant === "miniplayer" && miniplayerThumbVisible ? "opacity-100 scale-100" : ""} ${isDragging ? "scale-110" : ""}`.trim()
										}
									/>
								) : null}
							</>
						);
					}}
				</SliderTrack>
			</AriaSlider>
		);
	},
);

Slider.displayName = "Slider";
