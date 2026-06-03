/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vector2D } from '../types';

export class Coin {
  pos: Vector2D;
  value: number;
  radius: number;
  isMega: boolean;

  constructor(x: number, y: number, isMega = false) {
    this.pos = { x, y };
    this.isMega = isMega;
    this.value = isMega ? 300 : 100;
    this.radius = isMega ? 22 : 15;
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    const bounce = Math.sin(time / 200) * 5;
    
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y + bounce);
    
    // Outer glow
    ctx.shadowBlur = this.isMega ? 25 : 15;
    ctx.shadowColor = this.isMega ? '#ef4444' : '#fbbf24';
    
    // Coin
    ctx.fillStyle = this.isMega ? '#ef4444' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Extra ring for mega
    if (this.isMega) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Inner symbol
    ctx.strokeStyle = this.isMega ? '#fff' : '#92400e';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = this.isMega ? '#fff' : '#92400e';
    ctx.font = `bold ${this.isMega ? 20 : 16}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0);

    ctx.restore();
    ctx.shadowBlur = 0;
  }
}
