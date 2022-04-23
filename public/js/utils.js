import {
    BufferGeometry,
    BufferAttribute,
    //Geometry,
    LineBasicMaterial,
    Vector3,
    LineSegments,
    Line,

} from '../lib/three.js'

export const pass_geometry = new BufferGeometry()
pass_geometry.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, -1, 1, 0, 1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3))
pass_geometry.setAttribute('uv', new BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0]), 2))

// генерирует сетку
// w,h   - ширина
// cx,cy - сетка
// ox,oy - смещение
export const generate_grid = (w, h, cx, cy, ox, oy)=>{
    let a1x = 0, a2x = 0, a3x = 0, a4x = 0,
        a1y = 0, a2y = 0, a3y = 0, a4y = 0,
        u1x = 0, u2x = 0, u3x = 0, u4x = 0,
        u1y = 0, u2y = 0, u3y = 0, u4y = 0;
    let buff_p = new Float32Array(cx * cy * 18)
    let buff_u = new Float32Array(cx * cy * 12)
    let p1 = 0
    let p2 = 0
    let dx = w / cx
    let dy = h / cy
    let ux = 1 / cx
    let vx = 1 / cy
    let sw = true
    for (let y = 0; y < cy; y++) {
        for (let x = 0; x < cx; x++) {
            //
            // a1  a2
            // a4  a3
            //
            a1x = x * dx + 0 + ox;  a1y = y * dy + 0 + oy;
            a2x = x * dx + dx + ox; a2y = y * dy + 0 + oy;
            a3x = x * dx + dx + ox; a3y = y * dy + dy + oy;
            a4x = x * dx + 0 + ox;  a4y = y * dy + dy + oy;

            u1x = x * ux + 0;  u1y = (y * vx + 0);
            u2x = x * ux + ux; u2y = (y * vx + 0);
            u3x = x * ux + ux; u3y = (y * vx + vx);
            u4x = x * ux + 0;  u4y = (y * vx + vx);

            buff_p[p1 + 0]  = a1x;  buff_p[p1 + 2]  = a1y;
            buff_p[p1 + 6]  = a2x;  buff_p[p1 + 8]  = a2y;
            buff_p[p1 + 12] = a4x;  buff_p[p1 + 14] = a4y;
            buff_p[p1 + 15] = a3x;  buff_p[p1 + 17] = a3y;
            buff_u[p2 + 0]  = u1x;  buff_u[p2 + 1]  = u1y;
            buff_u[p2 + 4]  = u2x;  buff_u[p2 + 5]  = u2y;
            buff_u[p2 + 8]  = u4x;  buff_u[p2 + 9]  = u4y;
            buff_u[p2 + 10] = u3x;  buff_u[p2 + 11] = u3y;
            if (sw) {
                buff_p[p1 + 3] = a3x;  buff_p[p1 + 5] = a3y;
                buff_p[p1 + 9] = a1x;  buff_p[p1 + 11] = a1y;

                buff_u[p2 + 2] = u3x;  buff_u[p2 + 3] = u3y;
                buff_u[p2 + 6] = u1x;  buff_u[p2 + 7] = u1y;
            } else {
                buff_p[p1 + 3] = a4x;  buff_p[p1 + 5] = a4y;
                buff_p[p1 + 9] = a2x;  buff_p[p1 + 11] = a2y;

                buff_u[p2 + 2] = u4x;  buff_u[p2 + 3] = u4y;
                buff_u[p2 + 6] = u2x;  buff_u[p2 + 7] = u2y;
            }
            sw = !sw

            p1 = p1 + 18;
            p2 = p2 + 12;
        }
        sw = !sw
    }
    let geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(buff_p, 3))
    geometry.setAttribute('uv', new BufferAttribute(buff_u, 2))
    return geometry;
}

// гекс
export const generate_hex = ()=>{
    const scale = 1.0
    let a1x =  0.0 * scale, a1y = -0.50 * scale;
    let a2x =  0.5 * scale, a2y = -0.25 * scale; //0.433 - идеальный гекс
    let a3x =  0.5 * scale, a3y =  0.25 * scale;
    let a4x =  0.0 * scale, a4y =  0.50 * scale;
    let a5x = -0.5 * scale, a5y =  0.25 * scale;
    let a6x = -0.5 * scale, a6y = -0.25 * scale;
    //
    //    a1 
    // a6    a2
    // a5    a3 
    //    a4   
    //     
    const buff_p = new Float32Array(6*3*3)

    let p1 = 0
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a1x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a1y;
    buff_p[p1+6]  = a2x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a2y;
    p1 = p1 + 9
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a2x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a2y;
    buff_p[p1+6]  = a3x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a3y;
    p1 = p1 + 9
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a3x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a3y;
    buff_p[p1+6]  = a4x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a4y;
    p1 = p1 + 9
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a4x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a4y;
    buff_p[p1+6]  = a5x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a5y;
    p1 = p1 + 9
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a5x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a5y;
    buff_p[p1+6]  = a6x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a6y;
    p1 = p1 + 9
    buff_p[p1+0]  = 0.0; buff_p[p1+1]  = 0.0; buff_p[p1+2]  = 0.0;
    buff_p[p1+3]  = a6x; buff_p[p1+4]  = 0.0; buff_p[p1+5]  = a6y;
    buff_p[p1+6]  = a1x; buff_p[p1+7]  = 0.0; buff_p[p1+8]  = a1y;
    p1 = p1 + 9

    const geometry = new BufferGeometry()
    geometry.setAttribute( 'position', new BufferAttribute( buff_p, 3 ) )
    return geometry
}
/*

export const hex_selector = (color, scale)=> {
    let material = new LineBasicMaterial({
        color: color //0x555555
    })
    let geometry = new Geometry()
    //
    let h1 = 0.01
    let h2 = 0.02

    let a1x =  0.0 * scale, a1y = -0.5  * scale;
    let a2x =  0.5 * scale, a2y = -0.25 * scale; //0.433 - идеальный гекс
    let a3x =  0.5 * scale, a3y =  0.25 * scale;
    let a4x =  0.0 * scale, a4y =  0.5  * scale;
    let a5x = -0.5 * scale, a5y =  0.25 * scale;
    let a6x = -0.5 * scale, a6y = -0.25 * scale;
    //
    //    a1 
    // a6    a2
    // a5    a3 
    //    a4   
    //     

    geometry.vertices.push(
        new Vector3(a1x, h1, a1y),
        new Vector3(a2x, h1, a2y),

        new Vector3(a2x, h1, a2y),
        new Vector3(a3x, h1, a3y),

        new Vector3(a3x, h1, a3y),
        new Vector3(a4x, h1, a4y),

        new Vector3(a4x, h1, a4y),
        new Vector3(a5x, h1, a5y),

        new Vector3(a5x, h1, a5y),
        new Vector3(a6x, h1, a6y),

        new Vector3(a6x, h1, a6y),
        new Vector3(a1x, h1, a1y),
        //
        new Vector3(a1x, h2, a1y),
        new Vector3(a2x, h2, a2y),

        new Vector3(a2x, h2, a2y),
        new Vector3(a3x, h2, a3y),

        new Vector3(a3x, h2, a3y),
        new Vector3(a4x, h2, a4y),

        new Vector3(a4x, h2, a4y),
        new Vector3(a5x, h2, a5y),

        new Vector3(a5x, h2, a5y),
        new Vector3(a6x, h2, a6y),

        new Vector3(a6x, h2, a6y),
        new Vector3(a1x, h2, a1y),

    )
    return new LineSegments(geometry, material)
}

export const draw_line = (o1,o2)=>{
    const material = new LineBasicMaterial({
        color: 0xff0000,
    })
  
    const geometry = new BufferGeometry().setFromPoints(     
        [
            new Vector3( o1[0], o1[1], o1[2] ),
            new Vector3( o2[0], o2[1], o2[2] ) 
        ]
   )
    
    return new Line( geometry, material )
}
*/