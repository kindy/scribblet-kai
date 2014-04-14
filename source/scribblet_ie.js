/* 
 * Scribblet (http://scribblet.org)
 * Copyright (c) 2009 Kai Jäger. Some rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the license.txt file. 
 */

(function() {
	// All symbols used inside the code are declared here. This reduces the
	// number of "var" keywords in the code and helps the minifier do its job.
	var COLORS,
		LINE_COLORS,
		LINE_WIDTH,
		_absolute,
		_pixels,
		_window,
		_document,
		_documentBody,
		_documentElement,
		copyPasteBin,
		strokeColor,
		colorIndex,
		canvas,
		temp,
		temp2,
		temp3,
		temp4,
		temp5,
		scribble,
		isMouseDown,
		lastX,
		lastY,
		exportData,
		e,
		scrollTop;
	
	// "Constant" definitions
	LINE_COLORS = ['red', 'lime', 'blue', 'black'];
		
	exportData = '';
	
	// Assign DOM objects and functions to variables. This results in smaller 
	// code after minification.
	_window = window;
	_document = document;
	_documentBody = _document.body;
	_documentElement = _document.documentElement || _documentBody;

	function _createElement(tagName) {
		return _document.createElement(tagName);
	};

	function _appendChild(parent, child) {
		parent.appendChild(child);
	};
	
	function _removeChild(parent, child) {
		parent.removeChild(child);
	};
	
	scrollTop = _documentElement.scrollTop;

	_absolute = 'absolute';
	_pixels = 'px';

	// Current stroke color
	colorIndex = 0;
	strokeColor = LINE_COLORS[0];

	// Holds the internal representation of the current scribbble
	scribble = [];	

	// Create canvas, info display, copy & paste bin
	canvas = _createElement('div');
	with (canvas.style) {
		position = _absolute;
		left = top = '0';
		zIndex = '200';
		cursor = 'crosshair';
		background = 'url(_$_.gif)';
	}
	_appendChild(_documentBody, canvas);	
	
	_document.namespaces.add('v', 'urn:schemas-microsoft-com:vml', 
		'#default#VML');
	
	copyPasteBin = _createElement('input');
	with (copyPasteBin.style) {
		position = _absolute;
		left = '-1000' + _pixels;		
		top = scrollTop + _pixels
	}
	copyPasteBin.onpaste = function() {
		temp5 = _window.clipboardData.getData('Text');
		if (temp5.length < 3) { 
			return;
		}				
		scribble = temp5.split(/,/g);		

		temp5 = scribble.shift() - _documentElement.clientWidth;
		colorIndex = parseInt(scribble.shift());
		strokeColor = LINE_COLORS[colorIndex];		

		repaint();	
		exportScribble();
		_document.onfocus();
		_window.resizeBy(temp5, 0);	
	};
	
	temp = _document.onfocus = function() {
		with (copyPasteBin) {
			value = exportData;
			focus();
			select();
		}
	};
	_appendChild(_documentBody, copyPasteBin);
	temp();
		
	// Repaints the scribble
	function repaint() {
		var coords = [];
		canvas.innerHTML = '';
		temp2 = scribble.length;
		temp = 0;
		lastX = -1;
		lastY = -1;
		while (temp < temp2) {
			if (scribble[temp] == -1) {
				drawLine(coords);
				lastX = -1;
				coords.length = 0;
				++temp;
			} else {
				lastX = scribble[temp++];
				lastY = scribble[temp++] - scrollTop;		
				coords.push(lastX + 'px,' + lastY + 'px');
			}
		}
		drawLine(coords);
	};
	repaint();	
	
	function exportScribble() {
		scribble.unshift(colorIndex);
		scribble.unshift(_documentElement.clientWidth);
		copyPasteBin.value = exportData = scribble.join(',');
		scribble.shift();
		scribble.shift();		
		copyPasteBin.select();
		repaint();
	}
	
	function pushCoord(x, y) {
		scribble.push(x, y);
	}
	
	function drawLine(coords) {
		canvas.insertAdjacentHTML('beforeEnd', '<v:polyline points=\'' +
			coords.join(' ') + '\' filled=\'false\' strokecolor=\'' + 
			strokeColor + '\' strokeweight=\'3px\'></v:polyline>');
	}
	
	// Event handlers
	isMouseDown = false;
	
	temp = _window.onresize = function() {		
		with (canvas.style) {
			top = scrollTop + _pixels;
			width = _documentElement.clientWidth - 20 + _pixels;
			height = _documentElement.clientHeight + _pixels;
		}
		repaint();
	};
	temp();

	temp = _window.onscroll = function() {
		scrollTop = _documentElement.scrollTop;
		canvas.style.top = scrollTop + _pixels;
		copyPasteBin.style.top = scrollTop + _pixels;
		repaint();
	};	
	temp();
	
	_document.onmousedown = function() {
		e = _window.event;
		isMouseDown = true;
		lastX = e.clientX;
		lastY = e.clientY;
		pushCoord(lastX, lastY + scrollTop);
	};

	_document.onmouseup = function() {
		e = _window.event;
		isMouseDown = false;
		pushCoord(e.clientX, e.clientY + scrollTop);
		scribble.push(-1);
		
		exportScribble();
	};	

	_document.onmousemove = function() {
		e = _window.event;
		if (!isMouseDown) 
			return;
		temp = e.clientX;
		temp2 = e.clientY;
			
		pushCoord(temp, temp2 + scrollTop);
			
		drawLine([lastX + 'px,' + lastY, temp + 'px,' + temp2 + _pixels]);
		
		lastX = temp;
		lastY = temp2;
	};
	
	copyPasteBin.onkeyup = function() {
		e = _window.event;
		switch (e.keyCode) {
			// ESC or X - Close
			case 27:
			case 88:
				_removeChild(_documentBody, canvas);
				_removeChild(_documentBody, copyPasteBin);
				_document.onmousedown = _document.onmouseup = 
					_document.onmousemove = _document.onfocus = 
					_window.onresize = _window.onscroll = null;
				break;
			// UP/DOWN - Change color
			case 38:
			case 40:				
				colorIndex += 39 - e.keyCode;
				if (colorIndex < 0) colorIndex = LINE_COLORS.length - 1;
				strokeColor = LINE_COLORS[colorIndex % LINE_COLORS.length];
				exportScribble();	
				break;
			// E - Email
			case 69:
				_window.location = 'mailto:?body=' + exportData;
				break;
			// DEL - Clear
			case 46:
				scribble.length = 0;
				exportScribble();
		}
	};
})();