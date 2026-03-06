type AudioContextCtor = new () => AudioContext;

let uiSfxAudioContext: AudioContext | null = null;
const uiSfxLastPlayAt = new Map<string, number>();

function getUiSfxAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null;
	if (uiSfxAudioContext) return uiSfxAudioContext;

	const w = window as typeof window & { webkitAudioContext?: AudioContextCtor };
	const Ctor = w.AudioContext ?? w.webkitAudioContext;
	if (!Ctor) return null;

	try {
		uiSfxAudioContext = new Ctor();
		return uiSfxAudioContext;
	} catch {
		return null;
	}
}

function shouldSkipUiSfx(key: string, cooldownMs: number): boolean {
	if (typeof window === "undefined") return true;

	const nowMs = window.performance?.now() ?? Date.now();
	const lastPlayAt = uiSfxLastPlayAt.get(key) ?? 0;
	if (nowMs - lastPlayAt < cooldownMs) return true;

	uiSfxLastPlayAt.set(key, nowMs);
	return false;
}

/** Soft, muted tap for interactive choice selection. */
export function playChoiceSfx(): void {
	if (shouldSkipUiSfx("choice", 120)) return;

	const context = getUiSfxAudioContext();
	if (!context) return;

	const now = context.currentTime;
	const jitter = 1 + (Math.random() - 0.5) * 0.03;

	if (context.state !== "running") {
		void context.resume().catch(() => {});
	}

	try {
		const osc = context.createOscillator();
		const gain = context.createGain();
		const filter = context.createBiquadFilter();

		osc.type = "sine";
		osc.frequency.setValueAtTime(440 * jitter, now);
		osc.frequency.exponentialRampToValueAtTime(340 * jitter, now + 0.06);

		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(0.009, now + 0.004);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

		filter.type = "lowpass";
		filter.frequency.setValueAtTime(2400, now);
		filter.Q.setValueAtTime(0.5, now);

		osc.connect(gain).connect(filter).connect(context.destination);

		osc.start(now);
		osc.stop(now + 0.065);
	} catch {
		// Silent fallback: interaction still succeeds if audio synthesis fails.
	}
}

/** Soft descending whoosh for going back / retracing steps. */
export function playBackSfx(): void {
	if (shouldSkipUiSfx("back", 120)) return;

	const context = getUiSfxAudioContext();
	if (!context) return;

	const now = context.currentTime;
	const jitter = 1 + (Math.random() - 0.5) * 0.03;

	if (context.state !== "running") {
		void context.resume().catch(() => {});
	}

	try {
		const osc = context.createOscillator();
		const gain = context.createGain();
		const filter = context.createBiquadFilter();

		osc.type = "triangle";
		osc.frequency.setValueAtTime(520 * jitter, now);
		osc.frequency.exponentialRampToValueAtTime(260 * jitter, now + 0.08);

		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(0.011, now + 0.005);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

		filter.type = "lowpass";
		filter.frequency.setValueAtTime(2000, now);
		filter.Q.setValueAtTime(0.6, now);

		osc.connect(gain).connect(filter).connect(context.destination);

		osc.start(now);
		osc.stop(now + 0.09);
	} catch {
		// Silent fallback
	}
}

/** Bright rising tone for exploring a new branch / trying another ending. */
export function playExploreSfx(): void {
	if (shouldSkipUiSfx("explore", 120)) return;

	const context = getUiSfxAudioContext();
	if (!context) return;

	const now = context.currentTime;
	const jitter = 1 + (Math.random() - 0.5) * 0.03;

	if (context.state !== "running") {
		void context.resume().catch(() => {});
	}

	try {
		const osc = context.createOscillator();
		const gain = context.createGain();
		const filter = context.createBiquadFilter();

		osc.type = "sine";
		osc.frequency.setValueAtTime(380 * jitter, now);
		osc.frequency.exponentialRampToValueAtTime(620 * jitter, now + 0.07);

		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.005);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

		filter.type = "lowpass";
		filter.frequency.setValueAtTime(3200, now);
		filter.Q.setValueAtTime(0.7, now);

		osc.connect(gain).connect(filter).connect(context.destination);

		osc.start(now);
		osc.stop(now + 0.09);
	} catch {
		// Silent fallback
	}
}

export function playSwitchSfx(checked: boolean): void {
	if (shouldSkipUiSfx("switch", 60)) return;

	const context = getUiSfxAudioContext();
	if (!context) return;

	const now = context.currentTime;
	const jitter = 1 + (Math.random() - 0.5) * 0.04;

	if (context.state !== "running") {
		void context.resume().catch(() => {});
	}

	try {
		const transient = context.createOscillator();
		const transientGain = context.createGain();
		const body = context.createOscillator();
		const bodyGain = context.createGain();
		const outputFilter = context.createBiquadFilter();

		outputFilter.type = "lowpass";
		outputFilter.frequency.setValueAtTime(checked ? 5800 : 4700, now);
		outputFilter.Q.setValueAtTime(0.8, now);

		transient.type = "square";
		transient.frequency.setValueAtTime((checked ? 1900 : 1700) * jitter, now);
		transientGain.gain.setValueAtTime(0.0001, now);
		transientGain.gain.exponentialRampToValueAtTime(
			checked ? 0.012 : 0.01,
			now + 0.002,
		);
		transientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

		body.type = "triangle";
		body.frequency.setValueAtTime((checked ? 980 : 820) * jitter, now);
		bodyGain.gain.setValueAtTime(0.0001, now);
		bodyGain.gain.exponentialRampToValueAtTime(
			checked ? 0.007 : 0.0055,
			now + 0.004,
		);
		bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

		transient.connect(transientGain);
		transientGain.connect(outputFilter);
		body.connect(bodyGain);
		bodyGain.connect(outputFilter);
		outputFilter.connect(context.destination);

		transient.start(now);
		transient.stop(now + 0.02);
		body.start(now);
		body.stop(now + 0.05);
	} catch {
		// Silent fallback: interaction still succeeds if audio synthesis fails.
	}
}
