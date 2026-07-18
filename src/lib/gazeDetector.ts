import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

export interface GazeBaseline {
  meanX: number;
  meanY: number;
  stdDevX: number;
  stdDevY: number;
}

export class GazeDetector {
  private landmarker: FaceLandmarker | null = null;
  private isInitializing = false;
  
  // Accumulated points for calibration
  private calibrationData: { x: number; y: number }[] = [];

  async initialize() {
    if (this.landmarker) return;
    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    this.isInitializing = true;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });
      console.log("MediaPipe FaceLandmarker loaded successfully.");
    } catch (e) {
      console.error("Failed to initialize MediaPipe FaceLandmarker:", e);
    } finally {
      this.isInitializing = false;
    }
  }

  processFrame(
    videoElement: HTMLVideoElement,
    timestampMs: number,
    baseline: GazeBaseline | null,
    isCalibrating: boolean
  ): {
    gazeVector: { x: number; y: number } | null;
    landmarks: { x: number; y: number }[];
    zScore: number | null;
  } {
    if (!this.landmarker) {
      this.initialize();
      return { gazeVector: null, landmarks: [], zScore: null };
    }

    try {
      const result = this.landmarker.detectForVideo(videoElement, timestampMs);
      if (!result || result.faceLandmarks.length === 0) {
        return { gazeVector: null, landmarks: [], zScore: null };
      }

      const landmarks = result.faceLandmarks[0];

      // Left eye corner indexes: 33 (outer), 133 (inner), left iris center: 468
      // Right eye corner indexes: 362 (inner), 263 (outer), right iris center: 473
      const p33 = landmarks[33];
      const p133 = landmarks[133];
      const p468 = landmarks[468];

      const p362 = landmarks[362];
      const p263 = landmarks[263];
      const p473 = landmarks[473];

      if (!p33 || !p133 || !p468 || !p362 || !p263 || !p473) {
        return { gazeVector: null, landmarks: [], zScore: null };
      }

      // Horizontal ratio: where is the iris center relative to outer/inner corners
      const leftGazeX = (p468.x - p133.x) / (p33.x - p133.x);
      const leftGazeY = (p468.y - p133.y) / (p33.y - p133.y);

      const rightGazeX = (p473.x - p362.x) / (p263.x - p362.x);
      const rightGazeY = (p473.y - p362.y) / (p263.y - p362.y);

      const gazeX = (leftGazeX + rightGazeX) / 2;
      const gazeY = (leftGazeY + rightGazeY) / 2;

      const gazeVector = { x: gazeX, y: gazeY };

      if (isCalibrating) {
        this.calibrationData.push(gazeVector);
      }

      let zScore: number | null = null;
      if (baseline) {
        const zX = (gazeX - baseline.meanX) / Math.max(baseline.stdDevX, 0.015);
        const zY = (gazeY - baseline.meanY) / Math.max(baseline.stdDevY, 0.015);
        zScore = Math.sqrt(zX * zX + zY * zY);
      }

      // Extract key landmark index offsets for rendering:
      // Forehead(10), Nose tip(4), Mouth left(61), Mouth right(291), Chin(152), Left iris(468), Right iris(473)
      const renderIndices = [10, 4, 61, 291, 152, 468, 473];
      const renderLandmarks = renderIndices.map(idx => {
        const pt = landmarks[idx];
        return pt ? { x: pt.x, y: pt.y } : { x: 0.5, y: 0.5 };
      });

      return { gazeVector, landmarks: renderLandmarks, zScore };
    } catch (err) {
      console.error("Frame landmark evaluation failure:", err);
      return { gazeVector: null, landmarks: [], zScore: null };
    }
  }

  computeBaseline(): GazeBaseline | null {
    if (this.calibrationData.length < 20) return null;

    const n = this.calibrationData.length;
    let sumX = 0, sumY = 0;
    this.calibrationData.forEach(pt => {
      sumX += pt.x;
      sumY += pt.y;
    });
    const meanX = sumX / n;
    const meanY = sumY / n;

    let sqSumX = 0, sqSumY = 0;
    this.calibrationData.forEach(pt => {
      sqSumX += Math.pow(pt.x - meanX, 2);
      sqSumY += Math.pow(pt.y - meanY, 2);
    });
    const stdDevX = Math.sqrt(sqSumX / n);
    const stdDevY = Math.sqrt(sqSumY / n);

    this.calibrationData = []; // Clear calibration memory
    return { meanX, meanY, stdDevX, stdDevY };
  }
}

export const gazeDetector = new GazeDetector();
