import { Vector2D, CAR_CONFIG, CarStats } from '../types';

export class Car {
  pos: Vector2D;
  vel: Vector2D;
  angle: number;
  speed: number;
  isDrifting: boolean;
  tireMarks: { x: number; y: number; angle: number; opacity: number }[];
  stats: CarStats;

  constructor(x: number, y: number, stats: CarStats) {
    this.pos = { x, y };
    this.vel = { x: 0, y: 0 };
    this.angle = -Math.PI / 2;
    this.speed = 0;
    this.isDrifting = false;
    this.tireMarks = [];
    this.stats = stats;
  }

  get currentMaxSpeed() {
    return this.stats.maxSpeed + this.stats.upgrades.speed * 0.5;
  }

  get currentAcceleration() {
    return this.stats.acceleration + this.stats.upgrades.speed * 0.02;
  }

  get currentSteering() {
    return this.stats.steering + this.stats.upgrades.handling * 0.005;
  }

  update(keys: Set<string>) {
    const acc = this.currentAcceleration;
    const maxSpd = this.currentMaxSpeed;
    const steerRad = this.currentSteering;

    if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) {
      this.speed += acc;
    } else if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) {
      this.speed -= acc * 1.5; // Braking
    } else {
      this.speed *= 0.98; // Friction
    }

    this.speed = Math.min(Math.max(this.speed, -maxSpd / 3), maxSpd);

    let steerDir = 0;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) steerDir = -1; // A -> Chapga
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) steerDir = 1; // D -> O'ngga

    const steerSpeedFactor = Math.min(Math.abs(this.speed) / 3, 1.2);
    this.angle += steerDir * steerRad * steerSpeedFactor * (this.speed < 0 ? -1 : 1);

    const targetVelX = Math.cos(this.angle) * this.speed;
    const targetVelY = Math.sin(this.angle) * this.speed;

    const forwardX = Math.cos(this.angle);
    const forwardY = Math.sin(this.angle);
    const longSpeed = (this.vel.x * forwardX + this.vel.y * forwardY);
    const longVelX = forwardX * longSpeed;
    const longVelY = forwardY * longSpeed;
    const latVelX = this.vel.x - longVelX;
    const latVelY = this.vel.y - longVelY;
    const latSpeed = Math.sqrt(latVelX * latVelX + latVelY * latVelY);

    this.isDrifting = latSpeed > CAR_CONFIG.DRIFT_THRESHOLD && Math.abs(this.speed) > 2;

    const frictionFactor = this.isDrifting ? CAR_CONFIG.DRIFT_LATERAL_FRICTION : CAR_CONFIG.LATERAL_FRICTION;
    
    this.vel.x = longVelX * 0.99 + latVelX * frictionFactor + (targetVelX - longVelX) * 0.15;
    this.vel.y = longVelY * 0.99 + latVelY * frictionFactor + (targetVelY - longVelY) * 0.15;

    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;

    if (this.isDrifting) {
        this.tireMarks.push({ x: this.pos.x, y: this.pos.y, angle: this.angle, opacity: Math.min(latSpeed / 5, 0.8) });
        if (this.tireMarks.length > 300) this.tireMarks.shift();
    } else {
        if (this.tireMarks.length > 0) this.tireMarks.shift(); // Fade out old marks
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Tire marks
    this.tireMarks.forEach((m, i) => {
        ctx.globalAlpha = m.opacity * (i / this.tireMarks.length);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    // Car Body
    ctx.fillStyle = this.stats.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.stats.color;
    ctx.fillRect(-CAR_CONFIG.HEIGHT / 2, -CAR_CONFIG.WIDTH / 2, CAR_CONFIG.HEIGHT, CAR_CONFIG.WIDTH);
    
    // Glass
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(-5, -CAR_CONFIG.WIDTH / 2 + 2, 15, CAR_CONFIG.WIDTH - 4);

    ctx.restore();
    ctx.shadowBlur = 0;
  }
}
