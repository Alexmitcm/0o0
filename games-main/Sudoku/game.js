/**
	Gradle - KNOWLEDGE IS POWER

	@date: 02/18/2019 11:07:00
	@version_name: gradle-sudoku
	@version_code: v1.0.73
	copyright @2019
*/

function Sudoku(params) {
    var t = this;
    this.INIT = 0;
    this.RUNNING = 1;
    this.END = 2;
    this.id = params.id || 'sudoku_container';
    this.displaySolution = params.displaySolution || 0;
    this.displaySolutionOnly = params.displaySolutionOnly || 0;
    this.highlight = params.highlight || 0;
    this.fixCellsNr = params.fixCellsNr || 32;
    this.n = 3;
    this.nn = this.n * this.n;
    this.cellsNr = this.nn * this.nn;
    if (this.fixCellsNr < 10) this.fixCellsNr = 10;
    if (this.fixCellsNr > 70) this.fixCellsNr = 70;
    this.init();
    setInterval(function() {
        t.timer()
    }, 1000);
    return this
}

Sudoku.prototype.init = function() {
    this.status = this.INIT;
    this.cellsComplete = 0;
    this.board = [];
    this.boardSolution = [];
    this.cell = null;
    this.markNotes = 0;
    this.secondsElapsed = 0;
    this.board = this.boardGenerator(this.n, this.fixCellsNr);
    return this
};

Sudoku.prototype.timer = function() {
    if (this.status === this.RUNNING) {
        this.secondsElapsed++;
        $('.time').text('' + formatSeconds(this.secondsElapsed));
    }
};

Sudoku.prototype.shuffle = function(array) {
    var currentIndex = array.length,
        temporaryValue = 0,
        randomIndex = 0;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue
    }
    return array
};

Sudoku.prototype.boardGenerator = function(n, fixCellsNr) {
    var matrix_fields = [],
        index = 0,
        i = 0,
        j = 0,
        j_start = 0,
        j_stop = 0;
    this.boardSolution = [];
    for (i = 0; i < this.nn; i++) {
        matrix_fields[i] = i + 1
    }
    matrix_fields = this.shuffle(matrix_fields);
    for (i = 0; i < n * n; i++) {
        for (j = 0; j < n * n; j++) {
            var value = Math.floor((i * n + i / n + j) % (n * n) + 1);
            this.boardSolution[index] = value;
            index++
        }
    }
    var blank_indexes = [];
    for (i = 0; i < this.n; i++) {
        blank_indexes[i] = i + 1
    }
    var bands_horizontal_indexes = this.shuffle(blank_indexes);
    var board_solution_tmp = [];
    index = 0;
    for (i = 0; i < bands_horizontal_indexes.length; i++) {
        j_start = (bands_horizontal_indexes[i] - 1) * this.n * this.nn;
        j_stop = bands_horizontal_indexes[i] * this.n * this.nn;
        for (j = j_start; j < j_stop; j++) {
            board_solution_tmp[index] = this.boardSolution[j];
            index++
        }
    }
    this.boardSolution = board_solution_tmp;
    var bands_vertical_indexes = this.shuffle(blank_indexes);
    board_solution_tmp = [];
    index = 0;
    for (k = 0; k < this.nn; k++) {
        for (i = 0; i < this.n; i++) {
            j_start = (bands_vertical_indexes[i] - 1) * this.n;
            j_stop = bands_vertical_indexes[i] * this.n;
            for (j = j_start; j < j_stop; j++) {
                board_solution_tmp[index] = this.boardSolution[j + (k * this.nn)];
                index++
            }
        }
    }
    this.boardSolution = board_solution_tmp;
    var board_indexes = [],
        board_init = [];
    for (i = 0; i < this.boardSolution.length; i++) {
        board_indexes[i] = i;
        board_init[i] = 0
    }
    board_indexes = this.shuffle(board_indexes);
    board_indexes = board_indexes.slice(0, this.fixCellsNr);
    for (i = 0; i < board_indexes.length; i++) {
        board_init[board_indexes[i]] = this.boardSolution[board_indexes[i]];
        if (parseInt(board_init[board_indexes[i]]) > 0) {
            this.cellsComplete++
        }
    }
    return (this.displaySolutionOnly) ? this.boardSolution : board_init
};

Sudoku.prototype.drawBoard = function() {
    var index = 0,
        position = {
            x: 0,
            y: 0
        },
        group_position = {
            x: 0,
            y: 0
        };
    var sudoku_board = $('<div></div>').addClass('sudoku_board');
    var sudoku_statistics = $('<div></div>').addClass('statistics').html('<a href="./index.html" class="back">Back</a> <div class="cell_nr_container">'+gradle.text('cells', true)+'<br><span class="cells_complete">' + (this.cellsNr - this.cellsComplete) + '</span></div> <div class="timer_container">'+gradle.text('time', true)+'<br><span class="time">' + formatSeconds(this.secondsElapsed) + '</span></div><br class="clear">');
	var sudoku_tools_bar = $('<div></div>').addClass('tools_bar').html('<div class="restart">Restart</div> <div class="btn_sound">Sound</div> <div class="btn_change">'+gradle.text('edit', true)+'</div>');
	
    $('#' + this.id).empty();
    for (i = 0; i < this.nn; i++) {
        for (j = 0; j < this.nn; j++) {
            position = {
                x: i + 1,
                y: j + 1
            };
            group_position = {
                x: Math.floor((position.x - 1) / this.n),
                y: Math.floor((position.y - 1) / this.n)
            };
            var value = (this.board[index] > 0 ? this.board[index] : ''),
                value_solution = (this.boardSolution[index] > 0 ? this.boardSolution[index] : ''),
                cell = $('<div></div>').addClass('cell').attr('x', position.x).attr('y', position.y).attr('gr', group_position.x + '' + group_position.y).html('<span>' + value + '</span>');
            if (this.displaySolution) {
                $('<span class="solution">(' + value_solution + ')</span>').appendTo(cell)
            }
            if (value > 0) {
                cell.addClass('fix')
            }
            if (position.x % this.n === 0 && position.x != this.nn) {
                cell.addClass('border_h')
            }
            if (position.y % this.n === 0 && position.y != this.nn) {
                cell.addClass('border_v')
            }
            cell.appendTo(sudoku_board);
            index++
        }
    }
	sudoku_statistics.appendTo('#' + this.id);
    sudoku_board.appendTo('#' + this.id);
    sudoku_tools_bar.appendTo('#' + this.id);
	$('#' + this.id).on('click', '.btn_change', function(){
		animate_btn('.btn_change','pulse', change_val);
		//change_val();
	});
	
    var sudoku_console_cotainer = $('<div></div>').addClass('board_console_container');
    var sudoku_console = $('<div></div>').addClass('board_console');
    for (i = 1; i <= this.nn; i++) {
        $('<div></div>').addClass('num').text(i).appendTo(sudoku_console)
    }
    $('<div></div>').addClass('num remove').text('X').appendTo(sudoku_console);
    $('<div></div>').addClass('num note').text('?').appendTo(sudoku_console);
    var sudoku_gameover = $('<div class="gameover_container"><div class="gameover">Congratulation! <img src="./images/trophy.png"/><div class="restart">Play Again</div></div></div>');
    sudoku_console_cotainer.appendTo('#' + this.id).hide();
    sudoku_console.appendTo(sudoku_console_cotainer);
    sudoku_gameover.appendTo('#' + this.id).hide();
    this.resizeWindow()
};

Sudoku.prototype.resizeWindow = function() {
    //console.time("resizeWindow");
    var screen = {
        w: $(window).width(),
        h: $(window).height()
    };
    var b_pos = $('#' + this.id + ' .sudoku_board').offset(),
        b_dim = {
            w: $('#' + this.id + ' .sudoku_board').width(),
            h: $('#' + this.id + ' .sudoku_board').height()
        },
        s_dim = {
            w: $('#' + this.id + ' .statistics').width(),
            h: $('#' + this.id + ' .statistics').height()
        };
    var screen_wr = screen.w + s_dim.h + b_pos.top + 10;
    if (screen_wr > screen.h) {
        $('#' + this.id + ' .sudoku_board').css('width', (screen.h - b_pos.top - s_dim.h - 14));
        $('#' + this.id + ' .board_console').css('width', (b_dim.h / 2))
    } else {
        $('#' + this.id + ' .sudoku_board').css('width', '98%');
        $('#' + this.id + ' .board_console').css('width', '50%')
    }
    var cell_width = $('#' + this.id + ' .sudoku_board .cell:first').width(),
        note_with = Math.floor(cell_width / 2) - 1;
    $('#' + this.id + ' .sudoku_board .cell').height(cell_width);
    $('#' + this.id + ' .sudoku_board .cell span').css('line-height', cell_width + 'px');
    $('#' + this.id + ' .sudoku_board .cell .note').css({
        'line-height': note_with + 'px',
        'width': note_with,
        'height': note_with
    });
    var console_cell_width = $('#' + this.id + ' .board_console .num:first').width();
    $('#' + this.id + ' .board_console .num').css('height', console_cell_width);
    $('#' + this.id + ' .board_console .num').css('line-height', console_cell_width + 'px');
    b_dim = {
        w: $('#' + this.id + ' .sudoku_board').width(),
        h: $('#' + this.id + ' .sudoku_board').width()
    };
    b_pos = $('#' + this.id + ' .sudoku_board').offset();
    c_dim = {
        w: $('#' + this.id + ' .board_console').width(),
        h: $('#' + this.id + ' .board_console').height()
    };
    var c_pos_new = {
        left: (b_dim.w / 2 - c_dim.w / 2 + b_pos.left),
        top: (b_dim.h / 2 - c_dim.h / 2 + b_pos.top)
    };
    $('#' + this.id + ' .board_console').css({
        'left': c_pos_new.left,
        'top': c_pos_new.top
    });
    /*var gameover_pos_new = {
        left: (screen.w / 20),
        top: (screen.w / 20 + b_pos.top)
    };
    $('#' + this.id + ' .gameover').css({
        'left': gameover_pos_new.left,
        'top': gameover_pos_new.top
    })*/
};

Sudoku.prototype.showConsole = function(cell) {
    $('#' + this.id + ' .board_console_container').show();
    var t = this,
        oldNotes = $(this.cell).find('.note');
    $('#' + t.id + ' .board_console .num').removeClass('selected');
    if (t.markNotes) {
        $('#' + t.id + ' .board_console .num.note').addClass('selected');
        $.each(oldNotes, function() {
            var noteNum = $(this).text();
            $('#' + t.id + ' .board_console .num:contains(' + noteNum + ')').addClass('selected')
        })
    }
    return this
};

Sudoku.prototype.hideConsole = function(cell) {
    $('#' + this.id + ' .board_console_container').hide();
    return this
};

Sudoku.prototype.cellSelect = function(cell) {
	if ($(cell).hasClass('fix')) return;
	
    this.cell = cell;
    var value = $(cell).text() | 0,
        position = {
            x: $(cell).attr('x'),
            y: $(cell).attr('y')
        },
        group_position = {
            x: Math.floor((position.x - 1) / 3),
            y: Math.floor((position.y - 1) / 3)
        },
        horizontal_cells = $('#' + this.id + ' .sudoku_board .cell[x="' + position.x + '"]'),
        vertical_cells = $('#' + this.id + ' .sudoku_board .cell[y="' + position.y + '"]'),
        group_cells = $('#' + this.id + ' .sudoku_board .cell[gr="' + group_position.x + '' + group_position.y + '"]'),
        same_value_cells = $('#' + this.id + ' .sudoku_board .cell span:contains(' + value + ')');
    $('#' + this.id + ' .sudoku_board .cell').removeClass('selected current group');
    $('#' + this.id + ' .sudoku_board .cell span').removeClass('samevalue');
    $(cell).addClass('selected current');
    if (this.highlight > 0) {
        horizontal_cells.addClass('selected');
        vertical_cells.addClass('selected');
        group_cells.addClass('selected group');
        same_value_cells.not($(cell).find('span')).addClass('samevalue')
    }
    if ($(this.cell).hasClass('fix')) {
        $('#' + this.id + ' .board_console .num').addClass('no')
    } else {
        $('#' + this.id + ' .board_console .num').removeClass('no');
        //this.showConsole();
        this.resizeWindow()
    }
};

Sudoku.prototype.addValue = function(value) {
    var position = {
            x: $(this.cell).attr('x'),
            y: $(this.cell).attr('y')
        },
        group_position = {
            x: Math.floor((position.x - 1) / 3),
            y: Math.floor((position.y - 1) / 3)
        },
        horizontal_cells = '#' + this.id + ' .sudoku_board .cell[x="' + position.x + '"]',
        vertical_cells = '#' + this.id + ' .sudoku_board .cell[y="' + position.y + '"]',
        group_cells = '#' + this.id + ' .sudoku_board .cell[gr="' + group_position.x + '' + group_position.y + '"]',
        horizontal_cells_exists = $(horizontal_cells + ' span:contains(' + value + ')'),
        vertical_cells_exists = $(vertical_cells + ' span:contains(' + value + ')'),
        group_cells_exists = $(group_cells + ' span:contains(' + value + ')'),
        horizontal_notes = horizontal_cells + ' .note:contains(' + value + ')',
        vertical_notes = vertical_cells + ' .note:contains(' + value + ')',
        group_notes = group_cells + ' .note:contains(' + value + ')',
        old_value = parseInt($(this.cell).not('.notvalid').text()) || 0;
    if ($(this.cell).hasClass('fix')) {
        return
    }
    $(this.cell).find('span').text((value === 0) ? '' : value);
    if (this.cell !== null && (horizontal_cells_exists.length || vertical_cells_exists.length || group_cells_exists.length)) {
        if (old_value !== value) {
            $(this.cell).addClass('notvalid')
        } else {
            $(this.cell).find('span').text('')
        }
    } else {
        $(this.cell).removeClass('notvalid');
        $(horizontal_notes).remove();
        $(vertical_notes).remove();
        $(group_notes).remove()
    }
    this.cellsComplete = $('#' + this.id + ' .sudoku_board .cell:not(.notvalid) span:not(:empty)').length;
    if (this.cellsComplete === this.cellsNr) {
        this.gameOver()
    }
    $('#' + this.id + ' .statistics .cells_complete').text('' + ( this.cellsNr - this.cellsComplete ));
    return this
};

Sudoku.prototype.addNote = function(value) {
    var t = this,
        oldNotes = $(t.cell).find('.note'),
        note_width = Math.floor($(t.cell).width() / 2);
    if (oldNotes.length < 4) {
        $('<div></div>').addClass('note').css({
            'line-height': note_width + 'px',
            'height': note_width - 1,
            'width': note_width - 1
        }).text(value).appendTo(this.cell)
    }
    return this
};

Sudoku.prototype.removeNote = function(value) {
    if (value === 0) {
        $(this.cell).find('.note').remove()
    } else {
        $(this.cell).find('.note:contains(' + value + ')').remove()
    }
    return this
};

Sudoku.prototype.gameOver = function() {
    this.status = this.END;
    $('#' + this.id + ' .gameover_container').show();
    gradle.event('congratulations');
};

Sudoku.prototype.run = function() {
    this.status = this.RUNNING;
    var t = this;
    this.drawBoard();
    $('#' + this.id + ' .sudoku_board .cell').on('click', function(e) {
        t.cellSelect(this);
    });
    $('#' + this.id + ' .board_console .num').on('click', function(e) {
        var value = $.isNumeric($(this).text()) ? parseInt($(this).text()) : 0,
            clickMarkNotes = $(this).hasClass('note'),
            clickRemove = $(this).hasClass('remove'),
            numSelected = $(this).hasClass('selected');
        if (clickMarkNotes) {
            t.markNotes = !t.markNotes;
            if (t.markNotes) {
                $(this).addClass('selected')
            } else {
                $(this).removeClass('selected');
                t.removeNote(0).showConsole()
            }
        } else {
            if (t.markNotes) {
                if (!numSelected) {
                    if (!value) {
                        t.removeNote(0).hideConsole()
                    } else {
                        t.addValue(0).addNote(value).hideConsole();
						snd_set.play();
                    }
                } else {
                    t.removeNote(value).hideConsole()
                }
            } else {
                t.removeNote(0).addValue(value).hideConsole();
				snd_set.play();
            }
        }
    });
    $('#' + this.id + ' .board_console_container').on('click', function(e) {
        if ($(e.target).is('.board_console_container')) {
            $(this).hide()
        }
    });
    $('#' + this.id + ' .restart').on('click', function() {
		animate_btn('.restart', 'rotateOut', function(){
			t.init().run();
			gradle.event('replay');
		});
    });
    $(window).resize(function() {
        t.resizeWindow();
    })
};
var game = null;
var snd_track = null;
var snd_cell = null;
var snd_set = null;
$(function() {
	var nbcl = parseInt(window.location.hash.substr(1));
	if(nbcl == 0) nbcl=30;
    game = new Sudoku({
        id: 'gradle_sudoku',
        fixCellsNr: nbcl,
        highlight: 1,
    });
    game.run();
	game.resizeWindow();
	setTimeout(function(){gradle.event('button_play');}, 200);
	
	snd_cell  = new Audio('./sounds/selectcell.mp3'); 
	snd_set   = new Audio('./sounds/number-enter.mp3'); 
	snd_track = new Audio('./sounds/soundtrack.mp3'); 
	if (typeof snd_track.loop == 'boolean'){
		snd_track.loop = true;
	}
	else{
		snd_track.addEventListener('ended', function() {
			this.currentTime = 0;
			this.play();
		}, false);
	}
	snd_track.play();
	animate_btn('.timer_container','pulse');
	$('.btn_sound').addClass('no');
});

function animate_btn(element, animationName, callback) {
	const node = document.querySelector(element);
    node.classList.add('animated', animationName);

    function handleAnimationEnd() {
        node.classList.remove('animated', animationName);
        node.removeEventListener('animationend', handleAnimationEnd);

        if (typeof callback === 'function') callback();
    }

    node.addEventListener('animationend', handleAnimationEnd);
}

$('#gradle_sudoku').on('click','.btn_sound', function(){
	animate_btn('.btn_sound', 'flipinx');
	if(snd_track.paused){
		snd_track.play();
		$('.btn_sound').removeClass('no');
		gradle.event('sound_yes');
	} else{
		snd_track.pause();
		$('.btn_sound').addClass('no');
		gradle.event('sound_no');
	}
});


$('#gradle_sudoku').on('click','.cell', function(){
	if($(this).hasClass('fix')){
		return;
	}
	snd_cell.play();
});

$('#gradle_sudoku').on('click','.back', function(){
	animate_btn('.back', 'flipinx');
	gradle.event('back');
});

function formatSeconds(seconds){
    var date = new Date(1970,0,1);
    date.setSeconds(seconds);
    return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
}

function change_val(){
	if(game.cell == null) return;
	
	if ($(game.cell).hasClass('fix')) {
        $('#' + this.id + ' .board_console .num').addClass('no')
    } else {
        $('#' + this.id + ' .board_console .num').removeClass('no');
        game.showConsole();
        game.resizeWindow()
    }
}
