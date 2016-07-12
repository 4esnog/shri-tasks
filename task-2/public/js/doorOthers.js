// ===================== Пример кода первой двери =======================
/**
 * @class Door0
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Door0(number, onUnlock) {
    DoorBase.apply(this, arguments);


    var buttons = [
        this.popup.querySelector('.door-riddle__button_0'),
        this.popup.querySelector('.door-riddle__button_1'),
        this.popup.querySelector('.door-riddle__button_2')
    ];


    // REMOVE THIS!!!
    // buttons[0].addEventListener('click', function(e){
    //     this.unlock();
    // }.bind(this));
    // ==============


    buttons.forEach(function(b) {
        b.addEventListener('pointerdown', _onButtonPointerDown.bind(this));
        b.addEventListener('pointerup', _onButtonPointerUp.bind(this));
        b.addEventListener('pointercancel', _onButtonPointerUp.bind(this));
        b.addEventListener('pointerleave', _onButtonPointerUp.bind(this));
    }.bind(this));

    function _onButtonPointerDown(e) {
        e.target.classList.add('door-riddle__button_pressed');
        checkCondition.apply(this);
        console.log(e.pointerType);
    }

    function _onButtonPointerUp(e) {
        e.target.classList.remove('door-riddle__button_pressed');
        console.log(e.pointerType);
    }

    /**
     * Проверяем, можно ли теперь открыть дверь
     */
    function checkCondition() {
        var isOpened = true;
        buttons.forEach(function(b) {
            if (!b.classList.contains('door-riddle__button_pressed')) {
                isOpened = false;
            }
        });

        // Если все три кнопки зажаты одновременно, то откроем эту дверь
        if (isOpened) {
            this.unlock();
        }
    }

}

// Наследуемся от класса DoorBase
Door0.prototype = Object.create(DoorBase.prototype);
Door0.prototype.constructor = DoorBase;
// END ===================== Пример кода первой двери =======================

/**
 * @class Door1
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Door1(number, onUnlock) {
    DoorBase.apply(this, arguments);

    // ==== Напишите свой код для открытия второй двери здесь ====
    
    var names = ['chain', 'key', 'box', 'lock', 'bush', 'spikes'];
    var objects = {};
    var state = {
        lastCoords: {
            x: 0,
            y: 0
        },
        endCoords: {},
        lock: {
            visible: false
        }
    };


    // Записываем объекты в objects
    names.forEach(function(element, i, arr) {
        objects[element] = this.popup.querySelector('.door-1-riddle__' + element);
    }.bind(this));


    // Ломаем цепь свайпом, ломаем ящик о шипы, показываем ключик
    objects.chain.addEventListener('pointermove', function(e) {
        
        breakObject(e.target, e);
        objects.box.classList.add('box_drop-down');
        
        objects.box.addEventListener('animationend', function(e) {

            e.target.classList.add('hidden');
            showObject(objects.key);

            e.target.remove();
        });

    });

    // Ломаем куст касанием (за кустом - замок)
    objects.bush.addEventListener('pointerdown', function(e) {
        breakObject(e.target);
        state.lock.visible = true;
    });
    
    // Вешаем бработчик начала Drag'n'Drop (на ключике)
    objects.key.addEventListener('pointerdown', onKeyDrag.bind(this));




    // Обработчик начала DnD
    function onKeyDrag(e) {

        window.requestAnimationFrame(function() {
            e.target.style.transform = 'scale(1.3)';
        });

        state.startCoords = {
            x: e.pageX - state.lastCoords.x,
            y: e.pageY - state.lastCoords.y
        };
        state.dragOffset = {
            x: e.pageX - e.target.offsetLeft,
            y: e.pageY - e.target.offsetTop
        };

        state.onKeyMoveBinded = onKeyMove.bind(this, e.target, state.startCoords, state.dragOffset, state.endCoords);
        state.onKeyDropBinded = onKeyDrop.bind(this, e.target);


        this.popup.addEventListener('pointermove', state.onKeyMoveBinded);
        this.popup.addEventListener('pointerup', state.onKeyDropBinded);
        
        // console.log('onKeyDrag');
    }

    // Обработчик передвижения ключа
    function onKeyMove(obj, startCoords, dragOffset, endCoords, e) {
        
        endCoords.x = e.pageX - dragOffset.x;
        endCoords.y = e.pageY - dragOffset.y;

        window.requestAnimationFrame(function() {

            obj.style.left = endCoords.x + 'px';
            obj.style.top = endCoords.y + 'px';

            state.lastCoords.x = endCoords.x;
            state.lastCoords.y = endCoords.y;
            
        });

        // console.log('onKeyMove');       
    }

    // Обработчик окончания DnD
    function onKeyDrop(obj, e) {

        if ( (checkPointerPosMatch(objects.lock, e)) && (state.lock.visible) ) {
            this.unlock();
        }

        window.requestAnimationFrame(function() {
            e.target.style.transform = 'scale(1)';
        });
        
        this.popup.removeEventListener('pointermove', state.onKeyMoveBinded);
        this.popup.removeEventListener('pointerup', state.onKeyDropBinded);
        
        // console.log('onKeyDrop');
    }

    // Показать объект
    function showObject(node, e) {
        node.classList.add('appear');
        node.classList.remove('disappear', 'hidden');

        node.addEventListener('animationend', function(e) {
            node.classList.remove('appear');
            // console.log('Showing this:');
            // console.dir(node);
        });
    }

    // Удалить объект
    function breakObject(node, event, badClasses) {

        node.classList.remove('appear');
        node.classList.add('disappear');
        
        node.addEventListener('animationend', function (e) {
            node.remove();
            // console.log('Removing this:');
            // console.dir(node);
        });

    }

    // Проверка, находится ли pointer над объектом
    function checkPointerPosMatch(object, event) {
        
        var objCoords = object.getBoundingClientRect();

        if    ((event.pageX <= objCoords.left)
            || (event.pageX >= objCoords.left + objCoords.width)
            || (event.pageY <= objCoords.top)
            || (event.pageY >= objCoords.top + objCoords.height)) {
            return false;
        }

        return true;
    }

    // ==== END Напишите свой код для открытия второй двери здесь ====
}
Door1.prototype = Object.create(DoorBase.prototype);
Door1.prototype.constructor = DoorBase;

/**
 * @class Door2
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Door2(number, onUnlock) {
    DoorBase.apply(this, arguments);

    // ==== Напишите свой код для открытия третей двери здесь ====
    
    var names = ['ground_dirt', 'ground_grass', 'ground_stone', 'player'];
    var objects = {};
    var pointers = {};

    names.forEach(function(element, i, arr) {
        objects[element] = this.popup.querySelector('.door-2-riddle__' + element);
    }.bind(this));



    objects.ground_dirt.addEventListener('pointerdown', onDrag.bind(this, 'bottom'));
    objects.ground_grass.addEventListener('pointerdown', onDrag.bind(this, 'left'));
    objects.ground_stone.addEventListener('pointerdown', onDrag.bind(this, 'top'));
    objects.player.addEventListener('pointerup', function(e) {
        this.unlock();
    }.bind(this));




    function onDrag(direction, e) {
        
        var targetCoords = e.target.getBoundingClientRect();
        if ( !(e.pointerId in pointers) || (pointers[e.pointerId] == null) ) {

            pointers[e.pointerId] = {
                targetCoords: {
                    x: targetCoords.left,
                    y: targetCoords.top,
                    height: targetCoords.height,
                    width: targetCoords.width
                },

                offset: {
                    x: e.pageX - targetCoords.left,
                    y: e.pageY - targetCoords.top
                },

                target: e.target,
                onMove: onMove.bind(this, direction, e.pointerId),
                onDrop: onDrop.bind(this, e.pointerId)
            };

        } else {

            pointers[e.pointerId].targetCoords = {
                x: targetCoords.left,
                y: targetCoords.top
            };

            pointers[e.pointerId].offset = {
                x: e.pageX - pointers[e.pointerId].targetCoords.x,
                y: e.pageY - pointers[e.pointerId].targetCoords.y
            }

        }

        pointers[e.pointerId].target.style.transitionDuration = '0.1s';

        this.popup.addEventListener('pointermove', pointers[e.pointerId].onMove);
        this.popup.addEventListener('pointerup', pointers[e.pointerId].onDrop);

        // console.log('onDrag: ' + e.pointerId);
    }

    function onMove(direction, dragPointerId, e) {

        if (e.pointerId == dragPointerId) {

            var pointer = pointers[dragPointerId];

            if ((direction == 'left') || (direction == 'right')) {

                var newX = e.pageX - pointer.targetCoords.x - pointer.offset.x;
                console.log(newX);

                if (((direction == 'left') && (newX > 0))
                    || ((direction == 'right') && (newX < 0))) return;
                
                window.requestAnimationFrame(function() {
                    pointer.target.style.left = newX + 'px';
                });
            
            } else if ((direction == 'top') || (direction == 'bottom')) {
            
                var newY = e.pageY - pointer.targetCoords.y - pointer.offset.y;

                if (((direction == 'top') && (newY > 0))
                    || ((direction == 'bottom') && (newY < 0))) return;

                window.requestAnimationFrame(function(e) {
                    pointer.target.style.top = newY + 'px';
                });                    
            
            }
            // console.log('inner onMove: ' + e.pointerId);
        }

    }

    function onDrop(pointerId, e) {
        
        this.popup.removeEventListener('pointermove', pointers[pointerId].onMove);
        this.popup.removeEventListener('pointerup', pointers[pointerId].onDrop);

        window.requestAnimationFrame(function() {
            pointers[pointerId].target.style.transitionDuration = '0.5s';
            pointers[pointerId].target.style.transform = 'scale(1)';
        });
        

        for (var el in objects) {
            window.requestAnimationFrame(function(el) {
                if (!el) return;
                el.style.top = '';
                el.style.bottom = '0';
                el.style.left = '0'; 
            }.bind(this, objects[el]));
        }

        // console.log('onDrop: ' + pointerId);
    }

   
    // ==== END Напишите свой код для открытия третей двери здесь ====
}
Door2.prototype = Object.create(DoorBase.prototype);
Door2.prototype.constructor = DoorBase;

/**
 * Сундук
 * @class Box
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Box(number, onUnlock) {
    DoorBase.apply(this, arguments);

    // ==== Напишите свой код для открытия сундука здесь ====
    // Для примера сундук откроется просто по клику на него
    
    var circle = this.popup.querySelector('.door-3-riddle__circle');
    var pointers = {};
    
    this.popup.addEventListener('pointerdown', onPointerDown.bind(this));



    function onPointerDown(e) {
        var circleDims = circle.getBoundingClientRect();
        var circleCenter = {
            x: circleDims.left + (circleDims.width / 2),
            y: circleDims.top + (circleDims.height / 2)
        };

        pointers[e.pointerId] = {
            circleCenter: {
                x: circleDims.left + (circleDims.width / 2),
                y: circleDims.top + (circleDims.height / 2)
            },
            // вектор из центра круга в точку pointerdown
            startVector: {
                x: e.clientX - circleCenter.x,
                y: e.clientY - circleCenter.y
            },
            onPointerMove: onPointerMove.bind(this, e.pointerId),
            onPointerUp: onPointerUp.bind(this, e.pointerId)
        }
        
        this.popup.addEventListener('pointermove', pointers[e.pointerId].onPointerMove);
        this.popup.addEventListener('pointerup', pointers[e.pointerId].onPointerUp);
    }

    function onPointerMove(dragPointerId, e) {

        // Каждый обработчик обрабатывает только свой указатель
        if (dragPointerId !== e.pointerId) return;

        var pointer = pointers[dragPointerId];
        var prev, k, i = 0;

        // Вектор из центра круга в точку, где pointer находится в момент движения
        pointer.currVector = {
            x: e.clientX - pointer.circleCenter.x,
            y: e.clientY - pointer.circleCenter.y,
        }

        // Чтобы формула угла не была громоздкой
        var a = pointer.startVector;
        var b = pointer.currVector;

        // Угол между векторами (в радианах)
        var angle = Math.acos((a.x*b.x + a.y*b.y) / (Math.sqrt(a.x*a.x + a.y*a.y) * Math.sqrt(b.x*b.x + b.y*b.y)));
        // Делаем из угла коэф. [0;1]
        pointer.k = angle / Math.PI;
        
        // Применяем наименьший из коэфициентов всех указателей
        for (var el in pointers) {
            i++;          
            if (prev) k = (pointers[el].k <= prev.k) ? pointers[el].k : prev.k;
            prev = pointers[el];
        }      

        // Не делаем ничего, если указателей меньше 2
        if (i < 2) return;

        window.requestAnimationFrame(function() {
            circle.style.transform = 'scale(' + (4 - 4*k) + ')';
        });

        // Уровень пройден, если круг почти исчез (k --> 0)
        if (k >= 0.95) {
            this.unlock();
        }
    }

    function onPointerUp(dragPointerId, e) {
        if (dragPointerId == e.pointerId) {
           this.popup.removeEventListener('pointermove', pointers[dragPointerId].onPointerMove);
           this.popup.removeEventListener('pointerup', pointers[dragPointerId].onPointerUp);
           pointers[dragPointerId].k = 0;
           circle.style.transform = 'scale(4)';
       }
    }

    // ==== END Напишите свой код для открытия сундука здесь ====

    this.showCongratulations = function() {
        alert('Поздравляю! Игра пройдена!');
    };
}
Box.prototype = Object.create(DoorBase.prototype);
Box.prototype.constructor = DoorBase;
