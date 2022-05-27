/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
let chunks = []
export let count_x = 0      // количество чанков
export let count_y = 0

export const get     = (x,y)=>chunks[y*count_x+x]

export const getSize = ()=>count_x

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

// 

export const create = (size)=>{
    count_x = size
    count_y = size

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

