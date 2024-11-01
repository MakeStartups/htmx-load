# htmx-load
Handling third party libraries inside an htmx application can be challenging as 
you attempt to manage the initialization of each lib. 

This repo is an MIT-licensed agnostic framework for managing resource 
loading in a view/URL-specific method. It's more of a recipe than a library 
and you're encouraged to adapt or modify bits and pieces for your use case.

## Usage
This library is designed to work nicely with https://htmx.org.
```html 
<script src="/path/to/htmx.min.js"></script>
<script src="/path/to/htmx-load.js"></script>

<script type="text/javascript">
    // register a global callback to run on every single page load 
    // in your application.
    HtmxLoad.register('', global_load_function);
    
    // your application specific loading code
    function global_load_function() {
        const elements = document.querySelectorAll('.dropzone');
        if ( elements ) {
            for ( let i = 0; i < elements.length; ++i ) {
                new Dropzone(elements[i]);
            }
        }
       
        // more of your initialization code here... 
        // (font awesome, feathericons, chartjs, etc)
    }
</script>
```
## htmx partial-page specific handlers 
Assuming you have an htmx project that has specific partial html snippets 
loaded in your pages, you can use the htmx-load functionality from those 
pages as your code is loaded.
### Output of `/blog/23/edit`
```html 
<div id="blog_editor">
    <form> 
        <!-- ...fields and such --> 
        <textarea id="markdown-editor" name="blog_body"></textarea>
    </form>
</div>

<script type="text/javascript">
    HtmxLoad.register('blog/23/edit', function() {
        // grab the unstyled textarea and transform it into 
        // an EasyMDE rich editor.
        const markdown_el = document.getElementById('markdown-editor');
        new EasyMDE(markdown_el, options);
    });
</script>
```
## Overview 
This "library" was designed to allow you to have the tools to easily solve 
common collisions and problems using third-party javascript libraries in your 
htmx applications. This library was not designed to solve all of your problems 
as many of those will be unique to you and your specific needs. 

Please feel free to modify this library to work with your specific use-case. 

If you have any questions, please create a GitHub Issue or message 
[Eric Harrison on X](https://x.com/blister).
