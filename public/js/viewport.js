/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/
import * as CHUNKS from './chunks.js'

let max_steps       = 0       // количество видимых блоков от центра 5*2+1 = 11 = 11x11
let center_x        = -1      // центр    
let center_y        = -1
export let viewport = null    // список всех блоков
export let viewport_free   = null    // список занятых и сводобных
export let viewport_free_n = 0       // количество занятых 

// освобождаем ресурсы занятые блоком
const _free = (v)=>{
    if (v.ground!==null){
        v.ground.dispose()
    }
    v.ground = null
}

// сбрасываем настройки
const _zero = (v)=>{
    v.ground_ready = false
}

// обновляем центр камеры и соотвественно запускаеться обновление видимых блоков
export const update = (cx, cy) => {
    if (cx === center_x && cy===center_y){
        return
    }

    center_x = cx
    center_y = cy

    // освобождаем блоки которые выходят за обзор
    for (let i = viewport_free_n-1; i>=0 ; i--) {
        let n = viewport_free[i]
        let t = viewport[n]
        let dx = Math.abs(t.x - cx)
        let dy = Math.abs(t.y - cy)
        if (dx > max_steps || dy > max_steps) {
            viewport_free_n = viewport_free_n - 1
            let nn = viewport_free[viewport_free_n]
            viewport_free[viewport_free_n] = n
            viewport_free[i] = nn
            //
            const g = CHUNKS.get(t.x,t.y)
            _zero(g.viewport)
            g.viewport = null
        }
    }

    // подключаем блоки которые входят в обзор 
    let substep = 0
    let sub_count = 1
    let step = 0
    let complete = false
    while(!complete){
        if (cx>=0 && cy>=0 && cx<CHUNKS.count_x && cy<CHUNKS.count_y) {
            const g = CHUNKS.get(cx,cy)
            if (g.viewport === null) {
                let n = viewport_free[viewport_free_n]
                viewport_free_n = viewport_free_n + 1
                g.viewport   = viewport[n]
                g.viewport.x = cx
                g.viewport.y = cy
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
                    if (step === max_steps) {
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

// отключаем все блоки
export const free = ()=>{
    for (let i = 0; i < viewport_free_n; i++) {
        const n = viewport_free[i]
        const t = viewport[n]
        _free(t)
        const g = CHUNKS.get(t.x,t.y)
        g.viewport = null
    }
    viewport_free_n = 0
    center_x        = -1
    center_y        = -1
}

// создаем новые блоки
export const create = (size)=>{

    if (viewport!==null){
        free()
    }
    
    max_steps = size

    viewport      = new Array((max_steps*2 + 1) * (max_steps*2 + 1))
    viewport_free = new Array(viewport.length)    

    // подготовка
    for (let i = 0; i < viewport.length; i++) {
        viewport[i] = Object.seal({
            x                 : 0,
            y                 : 0,
            ground            : null,
            ground_ready      : false,
        })

        viewport_free[i] = i
    }

}
