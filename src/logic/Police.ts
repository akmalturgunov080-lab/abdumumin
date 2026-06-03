/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vector2D, CAR_CONFIG } from '../types';

export class Police {
  pos: Vector2D;
  angle: number;
  speed: number;
  color: string = '#ffffff';

  constructor(x: number, y: number) {
    this.pos = { x, y };
    this.angle = 0;
    this.speed = 4.5;
  }

  update(target: Vector2D) {
    const dx = target.x - this.pos.x;
    const dy = target.y - this.pos.y;
    const targetAngle = Math.atan2(dy, dx);
    
    // Smooth rotation towards target
    let diff = targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    
    this.angle += diff * 0.05;
    
    this.pos.x += Math.cos(this.angle) * this.speed;
    this.pos.y += Math.sin(this.angle) * this.speed;
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    // Car Body
    ctx.fillStyle = '#111';
    ctx.fillRect(-CAR_CONFIG.HEIGHT / 2, -CAR_CONFIG.WIDTH / 2, CAR_CONFIG.HEIGHT, CAR_CONFIG.WIDTH);
    
    // Police Markings
    ctx.fillStyle = '#fff';
    ctx.fillRect(-10, -CAR_CONFIG.WIDTH / 2, 20, CAR_CONFIG.WIDTH);
    
    // Sirens
    const sirenOn = Math.floor(time / 100) % 2 === 0;
    ctx.fillStyle = sirenOn ? '#ff0000' : '#0000ff';
    ctx.shadowBlur = sirenOn ? 15 : 0;
    ctx.shadowColor = ctx.fillStyle as string;
    ctx.fillRect(0, -CAR_CONFIG.WIDTH / 2 - 2, 5, 4);
    ctx.fillStyle = !sirenOn ? '#ff0000' : '#0000ff';
    ctx.shadowBlur = !sirenOn ? 15 : 0;
    ctx.shadowColor = ctx.fillStyle as string;
    ctx.fillRect(0, CAR_CONFIG.WIDTH / 2 - 2, 5, 4);

    ctx.restore();
    ctx.shadowBlur = 0;
  }
}
