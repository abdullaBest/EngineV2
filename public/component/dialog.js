let _minW = 200,
	_minH = 200,
	_resizePixel = 5,
	_dialog = this.el,
	_maxX, _maxY,
	_startX, _startY,
	_startW, _startH,
	_leftPos, _topPos,
	_isDrag = false,
	_isResize = false,
	_resizeMode = 0,
	_buttons,
	close_button = null,
	_tabs_buttons = null,
	_dialogContent = null,
	_dialogButtonPane = null,
	a = $._components.dialog
	
const _onMouseDown = (evt) => {
	const a = $._components.dialog
	if (!a._dialog){
		return
	}
	const rect = _getOffset(a._dialog)
	a._maxX = Math.max(
		document.documentElement["clientWidth"],
		document.body["scrollWidth"],
		document.documentElement["scrollWidth"],
		document.body["offsetWidth"],
		document.documentElement["offsetWidth"]
	)
	a._maxY = Math.max(
		document.documentElement["clientHeight"],
		document.body["scrollHeight"],
		document.documentElement["scrollHeight"],
		document.body["offsetHeight"],
		document.documentElement["offsetHeight"]
	)
	if (rect.right > a._maxX){
		a._maxX = rect.right
	}
	if (rect.bottom > _maxY){
		a._maxY = rect.bottom
	}
	a._startX = evt.pageX
	a._startY = evt.pageY
	a._startW = a._dialog.clientWidth
	a._startH = a._dialog.clientHeight
	a._leftPos = rect.left
	a._topPos  = rect.top
	if (a._resizeMode === 16) {
		_setCursor('move')
		a._isDrag = true
	} else if (a._resizeMode != 0){
		a._isResize = true
	}
}

const _onMouseMove = (evt) => {
	const a = $._components.dialog
	if (a._isDrag) {
		let dx   = a._startX - evt.pageX,
			dy   = a._startY - evt.pageY,
			left = a._leftPos - dx,
			top  = a._topPos - dy
		if (dx < 0) {
			if (left + a._startW > _maxX){
				left = a._maxX - a._startW
			}
		}
		if (dx > 0) {
			if (left < 0){
				left = 0
			}
		}
		if (dy < 0) {
			if (top + _startH > a._maxY){
				top = _maxY - a._startH
			}
		}
		if (dy > 0) {
			if (top < 0){
				top = 0
			}
		}
		a._dialog.style.left = Math.trunc(left) + 'px'
		a._dialog.style.top  = Math.trunc(top) + 'px'
	}
	else if (a._isResize) {
		let dw, dh, w, h
		if (a._resizeMode == 4) {
			dw = a._startX - evt.pageX
			if (a._leftPos - dw < 0)
				dw = a._leftPos
			w = a._startW + dw
			if (w < _minW) {
				w = _minW;
				dw = w - a._startW
			}
			a._dialog.style.width = w + 'px'
			a._dialog.style.left = (a._leftPos - dw) + 'px'
		}
		else if (a._resizeMode == 8) {
			dw = evt.pageX - a._startX
			if (a._leftPos + a._startW + dw > a._maxX)
				dw = a._maxX - a._leftPos - a._startW
			w = a._startW + dw
			if (w < _minW) { w = _minW }
			a._dialog.style.width = w + 'px';
		}
		else if (a._resizeMode == 1) {
			dh = a._startY - evt.pageY
			if (a._topPos - dh < 0)
				dh = a._topPos
			h = a._startH + dh
			if (h < _minH) {
				h = _minH
				dh = h - a._startH
			}
			a._dialog.style.height = h + 'px'
			a._dialog.style.top = (a._topPos - dh) + 'px'
		}
		else if (a._resizeMode == 2) {
			dh = evt.pageY - a._startY;
			if (a._topPos + a._startH + dh > a._maxY)
				dh = a._maxY - a._topPos - a._startH
			h = a._startH + dh
			if (h < _minH) { h = _minH }
			a._dialog.style.height = h + 'px';
		}
		else if (a._resizeMode == 5) {
			dw = a._startX - evt.pageX
			dh = a._startY - evt.pageY
			if (a._leftPos - dw < 0)
				dw = a._leftPos
			if (a._topPos - dh < 0)
				dh = a._topPos
			w = a._startW + dw
			h = a._startH + dh
			if (w < _minW) {
				w = _minW;
				dw = w - a._startW
			}
			if (h < _minH) {
				h = _minH;
				dh = h - a._startH
			}
			a._dialog.style.width  = w + 'px'
			a._dialog.style.height = h + 'px'
			a._dialog.style.left   = (a._leftPos - dw) + 'px'
			a._dialog.style.top    = (a._topPos - dh) + 'px'
		}
		else if (a._resizeMode == 6) {
			dw = a._startX - evt.pageX
			dh = evt.pageY - a._startY
			if (a._leftPos - dw < 0)
				dw = a._leftPos
			if (a._topPos + a._startH + dh > a._maxY)
				dh = a._maxY - a._topPos - a._startH
			w = a._startW + dw
			h = a._startH + dh
			if (w < _minW) {
				w = _minW;
				dw = w - a._startW
			}
			if (h < _minH) {
				h = _minH
			}
			a._dialog.style.width = w + 'px'
			a._dialog.style.height = h + 'px'
			a._dialog.style.left = (a._leftPos - dw) + 'px'
		}
		else if (a._resizeMode == 9) {
			dw = evt.pageX - a._startX
			dh = a._startY - evt.pageY
			if (a._leftPos + a._startW + dw > a._maxX)
				dw = a._maxX - a._leftPos - a._startW
			if (_topPos - dh < 0)
				dh = a._topPos
			w = a._startW + dw
			h = a._startH + dh
			if (w < _minW)
				w = _minW
			if (h < _minH) {
				h = _minH
				dh = h - a._startH
			}
			a._dialog.style.width = w + 'px'
			a._dialog.style.height = h + 'px'
			a._dialog.style.top = (a._topPos - dh) + 'px'
		}
		else if (a._resizeMode == 10) {
			dw = evt.pageX - a._startX
			dh = evt.pageY - a._startY
			if (a._leftPos + a._startW + dw > a._maxX)
				dw = _maxX - a._leftPos - a._startW
			if (a._topPos + a._startH + dh > a._maxY)
				dh = a._maxY - a._topPos - a._startH
			w = a._startW + dw
			h = a._startH + dh
			if (w < _minW)
				w = _minW
			if (h < _minH)
				h = _minH
			a._dialog.style.width = w + 'px'
			a._dialog.style.height = h + 'px'
		}
	}
	else {
		a._resizeMode = 0
		let parent = evt.target

		if (parent.classList.contains('title')){
			a._resizeMode = 16
		}

		while (parent.getAttribute && parent.getAttribute('component')!=='dialog'){
			parent = parent.parentNode
		}

		let rm = 0 //0 none 1-n 2-s 4-w 8-e
		if (parent.getAttribute && parent.getAttribute('component')==='dialog'){
			a._dialog = parent
			const rect = _getOffset(parent)
			if (evt.pageY < rect.top + _resizePixel) rm = 1
			else if (evt.pageY > rect.bottom - _resizePixel) rm = 2
			if (evt.pageX < rect.left + _resizePixel) rm += 4
			else if (evt.pageX > rect.right - _resizePixel) rm += 8

			if (rm != 0) {
				a._resizeMode = rm
				if (rm == 1 || rm == 2) _setCursor('ns-resize')
				else if (rm == 4 || rm == 8) _setCursor('ew-resize')
				else if (rm == 9 || rm == 6) _setCursor('nesw-resize')
				else if (rm == 5 || rm == 10) _setCursor('nwse-resize')
			}else{
				if (a._resizeMode===0){
					_setCursor('')
					a._dialog = null
				}
			}			
		}else{
			if (a._dialog!==null){
				_setCursor('')
			}
			a._dialog = null
		}
	}
}

const _onMouseUp = (evt) => {
	a._isDrag = false
	a._isResize = false
	a._resizeMode = 0
	_setCursor('')
}

const _getOffset = (elm) => {
	let rect = elm.getBoundingClientRect(),
		offsetX = window.scrollX || document.documentElement.scrollLeft,
		offsetY = window.scrollY || document.documentElement.scrollTop;
	return {
		left: rect.left + offsetX,
		top: rect.top + offsetY,
		right: rect.right + offsetX,
		bottom: rect.bottom + offsetY
	}
}

const _setCursor = cur=>{ if (a._dialog){ a._dialog.style.cursor = cur } }

const showTab = e=>{
	let n = 0
	if (Number.isInteger(e)){
		n = e
	}else{
		n = [..._tabs_buttons].indexOf(e.target)
		if (n===-1){
			return
		}
	}

	for (let i=0;i<_dialogContent.children.length;i++){
		_dialogContent.children[i].style.display = 'none'
	}
	for (let i=0;i<_dialogButtonPane.children.length;i++){
		_dialogButtonPane.children[i].style.display = 'none'
	}
	
	for (let i=0;i<_tabs_buttons.length;i++){
		_tabs_buttons[i].classList.remove('active')
	}
	_dialogContent.children[n].style.display = 'flex'
	_dialogButtonPane.children[n].style.display = 'block'
	_tabs_buttons[n].classList.add('active')
}

_dialogContent = _dialog.children[0].children[1]
_dialogButtonPane = _dialog.children[0].children[2]

if (a._dialog===undefined){
	a._dialog = null
	a._isDrag = false
	a._isResize = false 
	a._resizeMode = 0
	a._maxX = 0
	a._maxY = 0
	a._startX = 0
	a._startY = 0
	a._startW = 0
	a._startH = 0
	a._leftPos = 0
	a._topPos  = 0

	document.addEventListener('mousedown', _onMouseDown, false)
	document.addEventListener('mousemove', _onMouseMove, false)
	document.addEventListener('mouseup', _onMouseUp, false)
}

close_button = _dialog.querySelector('.close')
if (close_button) {
	close_button.innerHTML = '&#x2716'
	close_button.addEventListener('click', () => _dialog.style.display = 'none')
}

if (_dialogButtonPane){
	_buttons = _dialogButtonPane.querySelectorAll('button')
}else{
	_buttons = []
}

_tabs_buttons = _dialog.children[0].querySelectorAll('.tab')

if (_tabs_buttons.length>0){
	for (let i=0;i<_tabs_buttons.length;i++){
		_tabs_buttons[i].onclick = showTab
	}
	for (let i=0;i<_dialogContent.children.length;i++){
		_dialogContent.children[i].style.display = 'none'
	}
	showTab(0)
}

