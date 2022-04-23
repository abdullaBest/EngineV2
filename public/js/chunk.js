let chunks = []
export let count_x          = 0      // количество чанков
export let count_y          = 0
export let r_width          = 9      // размер блока
export let max_width        = 0      // максимальный размер карты 
export let half_max_width   = 0      // половина размера карты

export const viewport_max_steps = 1             //5*2+1 = 11 = 11x11
export let viewport_cx          = -1
export let viewport_cy          = -1
export const viewport           = new Array((viewport_max_steps*2 + 1) * (viewport_max_steps*2 + 1))
export const viewport_free      = new Array(viewport.length)
export let viewport_free_n      = 0                     // количество занятых 

// добавляет объект
export const add = (o,cx,cy)=>{
    const chunk = chunks[cy*count_x+cx]
    const first = chunk.objects_first
    if (first!==null){
        first.chunk_prev = o
    }
    o.chunk_next = first
    o.chunk_prev = null
    chunk.objects_first = o
    o.cx = cx
    o.cy = cy
}

// добавляет с сортировкой
export const add_sorted = (o,cx,cy)=>{
    const chunk = chunks[cy*count_x+cx]
    let oo = chunk.objects_first
    let tip = o.n
    while (oo!==null && oo.n!==tip){
        oo = oo.chunk_next
    }
    if (oo===null){
        let first = chunk.objects_first
        if (first!==null){
            first.chunk_prev = o
        }
        o.chunk_next = first
        o.chunk_prev = null
        chunk.objects_first = o
    }else{
        const next = oo.chunk_next
        if (next!==null){
            next.chunk_prev = o
        }
        o.chunk_next = next
        o.chunk_prev = oo
        oo.chunk_next = o
    }
    o.cx = cx
    o.cy = cy
}

export const find_by_prop = (prop,cx,cy)=>{
    const chunk = chunks[cy*count_x+cx]
    let o = chunk.objects_first
    while (o!==null && o.prop!==prop){
        o = o.chunk_next
    }
    return o
}

/*
// добавляем частицы
export const add_particle = (o)=>{
    const cx = Math.trunc(o.x/dx)
    const cy = Math.trunc(o.y/dy)
    o.cx = cx
    o.cy = cy

    const chunk = chunks[cy*count_x+cx]
    const first = chunk.particle_first
    if (first!==null){
        first.prev = o
    }
    o.next = first
    o.prev = null
    chunk.particle_first = o
}
*/

// удаляет объект из списка частиц
export const remove_particle = (o)=>{
    const prev = o.prev
    const next = o.next
    if (prev===null){
        chunks[o.cy*count_x+o.cx].particle_first = next
    }else{
        prev.next = next
    }
    if (next!==null){
        next.prev = prev
    }
    o.next = null
    o.prev = null
}


// удаляет объект из списка
export const remove = (o)=>{
    const prev = o.chunk_prev
    const next = o.chunk_next
    if (prev===null){
        chunks[o.cy*count_x+o.cx].objects_first = next
    }else{
        prev.chunk_next = next
    }
    if (next!==null){
        next.chunk_prev = prev
    }
    o.chunk_next = null
    o.chunk_prev = null
}

/*
// переносит объект
export const transfer = (o,x,y)=>{
    const cx = Math.trunc(x/dx)
    const cy = Math.trunc(y/dy)
    remove(o)
    add(o,cx,cy)
    o.x = x
    o.y = y
}
*/

export const get = (x,y)=>chunks[y*count_x+x]
// 
// ---------------------------------------------------

// обновляем центр камеры и соотвественно запускаеться обновление видимых блоков
export const update_viewport = (rx, ry) => {
    let cx = Math.trunc( (rx + half_max_width) / r_width)
    let cy = Math.trunc( (ry + half_max_width) / r_width)
    if (cx === viewport_cx && cy===viewport_cy){
        return
    }

    viewport_cx = cx
    viewport_cy = cy

    // освобождаем блоки которые выходят за обзор
    for (let i = viewport_free_n-1; i>=0 ; i--) {
        let n = viewport_free[i]
        let t = viewport[n]
        let dx = Math.abs(t.x - cx)
        let dy = Math.abs(t.y - cy)
        if (dx > viewport_max_steps || dy > viewport_max_steps) {
            viewport_free_n = viewport_free_n - 1
            let nn = viewport_free[viewport_free_n]
            viewport_free[viewport_free_n] = n
            viewport_free[i] = nn
            //
            let g = chunks[t.y * count_x + t.x]
            g.viewport = null
        }
    }

    // подключаем блоки которые входят в обзор 
    let substep = 0
    let sub_count = 1
    let step = 0
    let complete = false
    while(!complete){
        if (cx>=0 && cy>=0 && cx<count_x && cy<count_y) {
            let g = chunks[cy * count_x + cx]
            if (g.viewport === null) {
                let n = viewport_free[viewport_free_n]
                viewport_free_n = viewport_free_n + 1
                g.viewport   = viewport[n]
                g.viewport.x = cx
                g.viewport.y = cy
                g.viewport.ground_ready = false
                g.viewport.border_mesh_ready = false    
                g.viewport.grass_ready = false
                g.viewport.grass_count = 0
                if (g.viewport.photon50!==null){
                    g.viewport.photon50.dispose()
                }
                if (g.viewport.photon100!==null){
                    g.viewport.photon100.dispose()
                }
                g.viewport.photon50 = null
                g.viewport.photon100 = null

            }
        }

        if (sub_count === 0) {
            switch (substep) {
                case 0:
                    substep = 1
                    sub_count = step * 2 + 1
                break;
                case 1:
                    substep = 2
                    sub_count = step * 2 + 2
                    break;
                case 2:
                    sub_count = step * 2 + 2
                    substep = 3
                    break;
                case 3:
                    sub_count = step * 2 + 2
                    substep = 4
                    break;
                case 4:
                    substep = 0
                    sub_count = 1
                    step = step + 1
                    if (step === viewport_max_steps) {
                        //step = 0
                        complete = true
                    }
                    break;
            }
        }

        switch (substep) {
            case 0: cy = cy + 1; break;
            case 1: cx = cx - 1; break;
            case 2: cy = cy - 1; break;
            case 3: cx = cx + 1; break;
            case 4: cy = cy + 1; break;
        }

        sub_count = sub_count - 1

    }
}

// очищаем все видимые блоки
export const clear_viewport = ()=>{
    for (let i = 0; i < viewport_free_n; i++) {
        let n = viewport_free[i]
        let t = viewport[n]
        let g = chunks[t.y * count_x + t.x]
        g.viewport = null
    }
    viewport_free_n = 0
    viewport_cx     = -1
    viewport_cy     = -1
}

// подготоваливает массив 
export const prepare = (size,tile_width)=>{
    //
    clear_viewport()
    //
    count_x = size
    count_y = size
    //
    r_width = tile_width
    max_width = count_x*r_width
    half_max_width = max_width*0.5
    console.log('chunk r_width:',r_width,' cx:',count_x,' viewport:',viewport.length)
    //
    // подготавливаем блоки карты
    chunks.length = 0
    chunks.length = count_x*count_y
    for (let y=0;y<count_x;y++){
        for (let x=0;x<count_x;x++){
            chunks[y*count_x+x] = Object.seal({
                objects_first  : null,
                viewport       : null,
                particle_first : null,
            })
        }
    }   
}

// подготовка
for (let i = 0; i < viewport.length; i++) {
    viewport[i] = Object.seal({
        x                 : 0,
        y                 : 0,
        ground            : null,
        ground_ready      : false,
        border_mesh       : null,
        border_mesh_ready : false,
        grass_mesh        : null,
        grass_ready       : false,
        grass_count       : 0,
        photon50          : null,
        photon100         : null,
    })
    viewport_free[i] = i
}
