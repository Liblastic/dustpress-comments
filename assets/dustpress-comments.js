require( __dirname + '/dustpress-comments.css' );

window.DustPressComments = ( function( window, document, $ ){

    var app = {};

    // array for event listeners
    app.listeners = [];

    app.cache = function() {
        app.postId          = comments.post_id;
        app.formId          = '#' + comments.form_id;
        app.statusId        = '#' + comments.status_id
        app.replyLabel      = comments.reply_label;

        app.$section        = $('#comments__section');
        app.$formContainer  = app.$section.find(app.formId + '__container');
        app.$commentForm    = app.$section.find(app.formId);
        app.$replyLinks     = app.$section.find('a.comment-reply-link');
        app.$statusDiv      = app.$commentForm.find(app.statusId);
        app.$identifier     = app.$commentForm.find('#dustpress_comments_identifier');

        // init message boxes
        app.cacheMessageBoxes();
    };

    app.cacheMessageBoxes = function(id, container) {
        if (id) {
            app.$successBox     = container.find('#comments__success_' + id);
            app.$errorBox       = container.find('#comments__error_' + id);
            app.$warningBox     = container.find('#comments__warning_' + id);
        }
        else {
            app.$successBox     = app.$formContainer.find('#comments__success');
            app.$errorBox       = app.$formContainer.find('#comments__error');
            app.$warningBox     = app.$formContainer.find('#comments__warning');
        }
    }

    app.init = function(){
        app.cache();

        $.each( app.$replyLinks, app.removeReplyLink );

        app.listen();
        app.displayMessages();
        app.addIdentifier();
    };

    app.addListener = function(fn) {
        app.listeners.push(fn);
    }

    app.fireListeners = function() {
        $.each(app.listeners, function(i, fn) {
            fn.call();
        });
    }

    // event listeners
    app.listen = function() {
        // replying
        app.$replyLinks.on('click', function(e) {
            app.stop(e);
            app.hideMessages();
            app.addReplyForm( e.target );
        });
        // form submission
        app.$commentForm.submit(app.submit);
        // message boxes hiding
        app.$section.find('.close').on('click', function(e) {
            app.stop(e);
            app.hideMessages();
        })
    };

    app.addReplyForm = function( target ) {
        app.$closest    = $( target ).closest('.comment');
        var commentId   = app.$closest.data('id');

        // initialize reply form
        app.clearReplyForm();
        app.$replyForm = app.$formContainer.clone(true);

        // hide main form
        app.$formContainer.hide();

        // change form heading
        var small = app.$replyForm.find('#reply-title small');
        app.$replyForm.find('#reply-title').html(app.replyLabel).append(small);

        // set parent id
        app.$replyForm.find('#comment_parent').val(commentId);

        // init message fields
        app.$replyForm.find('#comments__success').attr('id', 'comments__success_' + commentId);
        app.$replyForm.find('#comments__error').attr('id', 'comments__error_' + commentId);
        app.$replyForm.find('#comments__warning').attr('id', 'comments__warning_' + commentId);

        // append to DOM
        app.$closest.append( app.$replyForm ); // with data and events
        app.$replyForm.show();

        app.cacheMessageBoxes(commentId, app.$replyForm);

        // cancel link
        app.$cancelReplyLink = app.$replyForm.find('#cancel-comment-reply-link');
        app.$cancelReplyLink.on('click', app.cancelReply);
        app.$cancelReplyLink.show();
    };

    app.cancelReply = function(e) {
        app.stop(e);
        app.clearReplyForm();
        app.cacheMessageBoxes();
        app.$formContainer.show();
    };

    app.removeReplyLink = function(idx, link) {
        link.setAttribute('onclick', null);
    };

    app.submit = function() {

        var formData = new FormData(this);

        $.ajax({
            url: app.$commentForm.attr('action'),
            type: 'POST',
            data: formData,
            success: function (data) {
                if ( 'object' !== typeof data ) {
                    data = JSON.parse(data);
                }
                if ( data.success ) {
                    app.handleSuccess(data);
                } else {
                    app.handleError(data);
                }
            },
            cache: false,
            contentType: false,
            processData: false
        });

        return false;
    }

    app.displayMessages = function() {
        if ( app.$successBox.hasClass('display') ) {
            app.$successBox.show();
        }
        if ( app.$errorBox.hasClass('display') ) {
            app.$errorBox.show();
        }
        if ( app.$warningBox.hasClass('display') ) {
            app.$warningBox.show();
        }
    };

    app.hideMessages = function() {
        app.$successBox.removeClass('display');
        app.$successBox.hide();
        app.$errorBox.removeClass('display');
        app.$errorBox.hide();
        app.$warningBox.removeClass('display');
        app.$warningBox.hide();
    };

    app.handleSuccess = function(data) {
        // remove reply form
        if (app.$replyForm) {
            app.clearReplyForm();
        }
        // replace comments section with rendered html
        app.$section.replaceWith(data.html);
        // reload comments app
        app.init();
        app.fireListeners();
    };

    app.handleError = function(data) {
        if ( data.error ) {
            console.log(app.$errorBox);
            app.$errorBox.html(data.message);
            app.$errorBox.show();
        }
        else {
            app.$errorBox.html('Error');
            app.$errorBox.show();
        }
    };

    app.addIdentifier = function() {
        $('<input type="hidden" name="dustpress_comments_ajax" value="1" />').insertAfter(app.$identifier);
    };

    app.clearReplyForm = function() {
        if ( app.$replyForm ) {
            app.$replyForm.remove();
            app.$replyForm = undefined;
        }
    }

    app.stop = function(event) {
        event.preventDefault ? event.preventDefault() : ( event.returnValue = false );
    };

    $(document).ready( app.init );

    return app;

})( window, document, jQuery );