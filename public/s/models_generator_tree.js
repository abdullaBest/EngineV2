const deg = a => a*Math.PI/180
const rad = a => a*180/Math.PI

let THREE  = null
let buff_p = null
let buff_u = null
let pos_p  = 0
let pos_u  = 0

const v1 = [0,0,0]
const v2 = [0,0,0]
const v3 = [0,0,0]
const v4 = [0,0,0]
const c  = [0,0,0]
const p1 = [0,0,0]
const p2 = [0,0,0]
const p3 = [0,0,0]
const p4 = [0,0,0]
const u1 = [0,0]
const u2 = [0,0]
const u3 = [0,0]
const u4 = [0,0]


const rnd_seed = (seed)=> {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

const _vec_axes_rot = (v1,angle)=>{
    const vx = [1,0,0]
    const vy = [0,0,1]
    v1[0] = vx[0]*Math.cos(angle) + vy[0]*Math.sin(angle)
    v1[1] = vx[1]*Math.cos(angle) + vy[1]*Math.sin(angle)
    v1[2] = vx[2]*Math.cos(angle) + vy[2]*Math.sin(angle)
}

const set_buff_old = (p,u)=> { 
    buff_p[pos_p+0] = p[0]
    buff_p[pos_p+1] = p[1]
    buff_p[pos_p+2] = p[2]

    buff_u[pos_u+0] = u[0]
    buff_u[pos_u+1] = u[1]

    pos_p = pos_p + 3
    pos_u = pos_u + 2
}

const set_buff = (p,u)=> { 
    buff_p.push(p[0],p[1],p[2])
    buff_u.push(u[0],u[1])
}

const buff_quad = (p1,p2,p3,p4,u1,u2,u3,u4)=>{
    set_buff(p1,u1)
    set_buff(p2,u2)
    set_buff(p3,u3)
    set_buff(p3,u3)
    set_buff(p2,u2)
    set_buff(p4,u4)
}

const v_set = (r,x,y,z)=>{ r[0]=x;r[1]=y;r[2]=z; }
const v_add = (r,a,b)=>{ r[0]=a[0]+b[0];r[1]=a[1]+b[1];r[2]=a[2]+b[2]; }
const v_sub = (r,a,b)=>{ r[0]=a[0]-b[0];r[1]=a[1]-b[1];r[2]=a[2]-b[2]; }
const v_mul = (r,a,n)=>{ r[0]=a[0]*n;r[1]=a[1]*n;r[2]=a[2]*n; }

const _tree = (cx,cy,nx,ny,width,height,top,seed)=>{

    let angle = Math.round(rnd_seed(seed)*360)
    seed = seed + 1
    _vec_axes_rot(v1,deg(angle))

    let halfsize = width/2.0
    v_set(c,cx,0,cy)
    v_set(v3,0,height,0)
    v_set(v4,0,height*top,0)
    v_mul(v1,v1,halfsize)
    //-----------------------
    v_sub(p1,c,v1)
    v_add(p2,c,v1)
    v_add(p3,p1,v3)
    v_add(p4,p2,v3)
    //
    const step = 1/8
    let ox = nx*step
    const oy = ny*step
    u1[0] = ox;      u1[1] = oy;
    u2[0] = ox+step; u2[1] = oy;
    u3[0] = ox;      u3[1] = oy+step;
    u4[0] = ox+step; u4[1] = oy+step;

    buff_quad(p1,p2,p3,p4,u1,u2,u3,u4)
    //-----------------------
    _vec_axes_rot(v2,deg(angle+90))
    v_mul(v2,v2,halfsize)
    v_sub(p1,c,v2)
    v_add(p2,c,v2)
    v_add(p3,p1,v3)
    v_add(p4,p2,v3)
    //
    buff_quad(p1,p2,p3,p4,u1,u2,u3,u4)
    //-----------------------
    
    v_sub(p1,c,v1)
    v_sub(p1,p1,v2)
    v_add(p1,p1,v4)

    v_add(p2,c,v1)
    v_sub(p2,p2,v2)
    v_add(p2,p2,v4)

    v_sub(p3,c,v1)
    v_add(p3,p3,v2)
    v_add(p3,p3,v4)

    v_add(p4,c,v1)
    v_add(p4,p4,v2)
    v_add(p4,p4,v4)

    //
    ox = ox + step
    u1[0] = ox;     
    u2[0] = ox+step;
    u3[0] = ox;     
    u4[0] = ox+step;
    //
    buff_quad(p1,p2,p3,p4,u1,u2,u3,u4)
    
}

const generate_tree = (THREE,type,count,seed)=>{

    let count1 = count

    let buff_p = new Float32Array(count1 * (18*3))
    let buff_u = new Float32Array(count1 * (12*3))
    let p1 = 0
    let p2 = 0
    let v1 = [0,0,0]

    let sw = 0
    for (let i=0;i<count1;i++){
        let angle = Math.round(rnd_seed(seed)*360)
        seed = seed + 1
        _vec_axes_rot(v1,deg(angle))

        let d = rnd_seed(seed)
        seed = seed + 1
        let cx = v1[0]*d*0.5
        let cy = v1[2]*d*0.5

        d = rnd_seed(seed)
        seed = seed + 1
        
        d = rnd_seed(seed)
        seed = seed + 1
        switch(type){
            /*
            case 0:{
                let h = 0.20 + d*0.1
                let w = 0.20 + d*0.1
                switch(sw){
                    case 0:{
                        _tree(cx,cy,4,2,buff_p,buff_u,p1,p2,w,h,0.6,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,6,2,buff_p,buff_u,p1,p2,w,h,0.6,seed)
                        sw = 0
                    }
                    break;
                }
            } 
            break;
            case 1:{
                let h = 0.20 + d*0.15
                let w = 0.20 + d*0.05
                switch(sw){
                    case 0:{
                        _tree(cx,cy,6,5,buff_p,buff_u,p1,p2,w,h,0.2,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,6,6,buff_p,buff_u,p1,p2,w,h,0.2,seed)
                        sw = 0
                    }
                    break;
                }
            } 
            break;
            case 2: _tree(cx,cy,0,2,buff_p,buff_u,p1,p2,w,h,0.5,seed)
            break;
            case 3: {
                let h = 0.2 + d*0.2
                let w = 0.2 + d*0.1
                switch(sw){
                    case 0:{
                        _tree(cx,cy,4,0,buff_p,buff_u,p1,p2,w,h,0.4,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,6,0,buff_p,buff_u,p1,p2,w,h,0.4,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            case 4: {
                let h = 0.2 + d*0.2
                let w = 0.2 + d*0.1
                _tree(cx,cy,4,1,buff_p,buff_u,p1,p2,w,h,0.45,seed)
            }
            break;
            case 5: { // пальма
                let h = 0.2 + d*0.2
                let w = 0.2 + d*0.1
                switch(sw){
                    case 0:{
                        _tree(cx,cy,4,4,buff_p,buff_u,p1,p2,w,h,0.6,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,6,4,buff_p,buff_u,p1,p2,w,h,0.7,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            case 6: { // пальма
                let h = 0.2 + d*0.2
                let w = 0.2 + d*0.1
                switch(sw){
                    case 0:{
                        _tree(cx,cy,0,4,buff_p,buff_u,p1,p2,w,h,0.6,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,2,4,buff_p,buff_u,p1,p2,w,h,0.7,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            case 7: { // елка
                let h = 0.2 + d*0.1
                let w = 0.1 + d*0.1
                switch(sw){
                    case 0:{
                        _tree(cx,cy,0,3,buff_p,buff_u,p1,p2,w,h,0.2,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,2,3,buff_p,buff_u,p1,p2,w,h,0.2,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            case 8: { // береза
                let h = 0.3 + d*0.1
                let w = 0.3 + d*0.1
                switch(sw){
                    case 0:{
                        _tree(cx,cy,0,2,buff_p,buff_u,p1,p2,w,h,0.3,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,2,2,buff_p,buff_u,p1,p2,w,h,0.3,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            case 9: { // пихта
                let h = 0.3 + d*0.1
                let w = 0.2 + d*0.1
                switch(sw){
                    case 0:{
                        _tree(cx,cy,0,0,buff_p,buff_u,p1,p2,w,h,0.2,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,2,0,buff_p,buff_u,p1,p2,w,h,0.3,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            case 10: { // кипарис
                let h = 0.25 + d*0.1
                let w = 0.08 + d*0.05
                switch(sw){
                    case 0:{
                        _tree(cx,cy,0,1,buff_p,buff_u,p1,p2,w,h,0.2,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,2,1,buff_p,buff_u,p1,p2,w,h,0.3,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            case 11: { // кипарис
                let h = 0.25 + d*0.1
                let w = 0.25 + d*0.1
                switch(sw){
                    case 0:{
                        _tree(cx,cy,0,6,buff_p,buff_u,p1,p2,w,h,0.2,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,2,6,buff_p,buff_u,p1,p2,w,h,0.2,seed)
                        sw = sw + 1
                    }
                    break;
                    case 2:{
                        _tree(cx,cy,4,6,buff_p,buff_u,p1,p2,w,h,0.3,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            case 12: { // конский каштан
                let h = 0.20 + d*0.1
                let w = 0.25 + d*0.1
                switch(sw){
                    case 0:{
                        _tree(cx,cy,0,5,buff_p,buff_u,p1,p2,w,h,0.6,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,2,5,buff_p,buff_u,p1,p2,w,h,0.6,seed)
                        sw = sw + 1
                    }
                    break;
                    case 2:{
                        _tree(cx,cy,4,5,buff_p,buff_u,p1,p2,w,h,0.6,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            case 13: { // 
                let h = 0.20 + d*0.1
                let w = 0.20 + d*0.1
                switch(sw){
                    case 0:{
                        _tree(cx,cy,4,1,buff_p,buff_u,p1,p2,w,h,0.5,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,4,1,buff_p,buff_u,p1,p2,w,h,0.5,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            */
            case 14: { // мелкие деревья 1
                let h = 0.10 + d*0.15
                let w = 0.10 + d*0.05
                switch(sw){
                    // 4,7
                    // 0,6 - 2,6 - 4,6 -6,6
                    case 0:{
                        _tree(cx,cy,x1,y1,buff_p,buff_u,p1,p2,w,h,0.5,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,x2,y2,buff_p,buff_u,p1,p2,w,h,0.5,seed)
                        sw = sw + 1
                    }
                    break;
                    case 2:{
                        _tree(cx,cy,x3,y3,buff_p,buff_u,p1,p2,w,h,0.5,seed)
                        sw = sw + 1
                    }
                    break;
                    case 3:{
                        _tree(cx,cy,x4,y4,buff_p,buff_u,p1,p2,w,h,0.5,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            case 15: { // мелкие деревья 2
                let h = 0.15 + d*0.05
                let w = 0.15 + d*0.05
                switch(sw){
                    // 4,7
                    // 0,6 - 2,6 - 4,6 -6,6
                    case 0:{
                        _tree(cx,cy,x1,y1,buff_p,buff_u,p1,p2,w,h,0.5,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,x2,y2,buff_p,buff_u,p1,p2,w,h,0.5,seed)
                        sw = sw + 1
                    }
                    break;
                    case 2:{
                        _tree(cx,cy,x3,y3,buff_p,buff_u,p1,p2,w,h,0.5,seed)
                        sw = sw + 1
                    }
                    break;
                    case 3:{
                        _tree(cx,cy,x4,y4,buff_p,buff_u,p1,p2,w,h,0.5,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
            case 16: { // мелкие деревья 2
                let h = _h + d*_hd
                let w = _w + d*_wd
                switch(sw){
                    case 0:{
                        _tree(cx,cy,x1,y1,buff_p,buff_u,p1,p2,w,h,m,seed)
                        sw = sw + 1
                    }
                    break;
                    case 1:{
                        _tree(cx,cy,x2,y2,buff_p,buff_u,p1,p2,w,h,m,seed)
                        sw = sw + 1
                    }
                    break;
                    case 2:{
                        _tree(cx,cy,x3,y3,buff_p,buff_u,p1,p2,w,h,m,seed)
                        sw = sw + 1
                    }
                    break;
                    case 3:{
                        _tree(cx,cy,x4,y4,buff_p,buff_u,p1,p2,w,h,m,seed)
                        sw = 0
                    }
                    break;
                }
            }
            break;
        }
        p1=p1+18*3
        p2=p2+12*3
    }
    

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(buff_p, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(buff_u, 2))
    return geometry
}

const generate_tree2 = (count,seed,blocks,m)=>{

    buff_p = new Float32Array(count * (18*3))
    buff_u = new Float32Array(count * (12*3))
    pos_p = 0
    pos_u = 0
    let v1 = [0,0,0]

    let sw = 0
    for (let i=0;i<count;i++){
        let angle = Math.round(rnd_seed(seed)*360)
        seed = seed + 1
        _vec_axes_rot(v1,deg(angle))

        let d = rnd_seed(seed)
        seed = seed + 1
        let cx = v1[0]*d*0.5
        let cy = v1[2]*d*0.5

        d = rnd_seed(seed)
        seed = seed + 1
        
        d = rnd_seed(seed)
        seed = seed + 1


        let h = _h + d*_hd
        let w = _w + d*_wd
        let bx = blocks[sw*2+0]
        let by = blocks[sw*2+1]
        switch(sw){
            case 0:{
                _tree(cx,cy,bx,by,w,h,m,seed)
                sw = 1
            }
            break;
            case 1:{
                _tree(cx,cy,bx,by,w,h,m,seed)
                sw = 2
            }
            break;
            case 2:{
                _tree(cx,cy,bx,by,w,h,m,seed)
                sw = 3
            }
            break;
            case 3:{
                _tree(cx,cy,bx,by,w,h,m,seed)
                sw = 0
            }
            break;
        }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(buff_p, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(buff_u, 2))
    return geometry
}

const generate_tree3 = (count,seed,_w,_wd,_h,_hd,m,blocks)=>{
    buff_p = []
    buff_u = []

    let sw = 0
    for (let i=0;i<count;i++){
        let angle = Math.round(rnd_seed(seed)*360)
        seed = seed + 1
        _vec_axes_rot(v1,deg(angle))

        let d = rnd_seed(seed)
        seed = seed + 1
        let cx = v1[0]*d*0.5
        let cy = v1[2]*d*0.5

        d = rnd_seed(seed)
        seed = seed + 1
        let h = _h + d*_hd
        
        d = rnd_seed(seed)
        seed = seed + 1
        let w = _w + d*_wd

        let bx = blocks[sw+0]
        let by = blocks[sw+1]
        _tree(cx,cy,bx,by,w,h,m,seed)
        sw = sw + 2
        if (sw===blocks.length){
            sw = 0
        }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buff_p), 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(buff_u), 2))
    return geometry
}

if (params===undefined){
    return {
        //count  : 100,
        //seed   : 389047289,
        //blocks : [0,6,2,6,4,6,0,6],
        //m      : 0.5,
    }
}else{
    import('/lib/three.js').then(_THREE => {
        THREE = _THREE
        let obj = params.obj
        if (obj){
            while (obj.children.length!==0){
                let a = obj.children[0]
                obj.remove(a)
                if (a.geometry){
                    a.geometry.dispose()
                }
            }
        }

        //-------------------------------
        // маленькие деревья
        //
        let a = [
            120, 40897240033,
            100, 65517641050,
            80, 15439017369,
            60, 66094285618,
            40, 31071143285,
            20, 68531017379,
        ]

        const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} )

        for (let i=0;i<a.length;i=i+2){
            const mesh = new THREE.Mesh(generate_tree3(a[i+0],a[i+1],0.10,0.05,0.10,0.15,0.5,[0,6,2,6,4,6,0,6]),material)
            mesh.name = 'a'+(i/2+1)
            obj.add( mesh )
        }    

        //
        a = [
            120, 86149706681,
            100, 68524176482,
            80, 70089245144,
            60, 50176933849,
            40 , 63672507285,
            20 , 20051094713,
        ]
        for (let i=0;i<a.length;i=i+2){
            let mesh = new THREE.Mesh(generate_tree3(a[i+0],a[i+1],0.15,0.05,0.15,0.05,0.5,[0,5,2,5,4,5,0,5]),material)
            mesh.name = 'b'+(i/2+1)
            obj.add( mesh )
        }    
        //
        a = [
            80, 7200905351,
            60, 76188023729,
            40, 10078018285,
            30, 2763052390,
            20, 82267072504,
            10, 96044704082,
        ]
        for (let i=0;i<a.length;i=i+2){
            let mesh = new THREE.Mesh(generate_tree3(a[i+0],a[i+1],0.15,0.05,0.15,0.10,0.7,[0,4,2,4,2,4,0,4]),material)
            mesh.name = 'c'+(i/2+1)
            obj.add( mesh )
        }    
        //
        a = [
            40, 15639122689,
            40, 69852093439,
            30, 20849210439,
            30, 85729597137,
            20, 86307368231,
            10, 55898228144,
        ]
        for (let i=0;i<a.length;i=i+2){
            let mesh = new THREE.Mesh(generate_tree3(a[i+0],a[i+1],0.15,0.05,0.15,0.10,0.7,[4,4,4,4,6,4,6,4]),material)
            mesh.name = 'd'+(i/2+1)
            obj.add( mesh )
        }    
        //
        a = [
            80, 39691992382,
            70, 80997325709,
            60, 47678849622,
            50, 14841537529,
            40, 26838217640,
            20, 85729597137,
        ]
        for (let i=0;i<a.length;i=i+2){
            let mesh = new THREE.Mesh(generate_tree3(a[i+0],a[i+1],0.10,0.10,0.15,0.10,0.3,[0,2,2,3,0,2,2,2]),material)
            mesh.name = 'e'+(i/2+1)
            obj.add( mesh )
        }    
        //
        a = [
            80, 80145947179,
            70, 63632587775,
            60, 619795951,
            50, 11247832824,
            40, 60279732740,
            20, 14271381414,
        ]
        for (let i=0;i<a.length;i=i+2){
            let mesh = new THREE.Mesh(generate_tree3(a[i+0],a[i+1],0.15,0.05,0.20,0.05,0.5,[4,0,4,0,6,0,6,0]),material)
            mesh.name = 'f'+(i/2+1)
            obj.add( mesh )
        }    
/*
        let mesh = obj.getObjectByName('generated_tree')
        if (mesh){
            mesh.geometry.dispose()
            mesh.geometry = geometry
        }else{
            const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} )
            mesh = new THREE.Mesh(geometry,material)
            mesh.name='generated_tree'
            obj.add( mesh )
        }
*/

        callback()
    })
    .catch(err => console.log(err))
}
