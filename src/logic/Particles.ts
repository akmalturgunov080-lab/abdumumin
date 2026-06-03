/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;

  constructor(x: number, y: number, angle: number, speed: number) {
    this.x = x;
    this.y = y;
    // Emit opposite to movement direction with some spread
    const spread = (Math.random() - 0.5) * 0.5;
    this.vx = Math.cos(angle + Math.PI + spread) * speed * 0.5;
    this.vy = Math.sin(angle + Math.PI + spread) * speed * 0.5;
    this.maxLife = 30 + Math.random() * 30;
    this.life = this.maxLife;
    this.size = 2 + Math.random() * 5;
    this.color = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.size += 0.2;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const opacity = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
