module.exports = function (grunt) {

    var js = '../www/js/';
    var options = {
        novas: { files: {} },
        demo: { files: {} }
    };

    options.novas.files[js + 'nova.data.js'] = [js + 'nova.data/*.js', js + 'nova.data/*/*.js'];
    options.demo.files[js + 'demo.js'] = [js + 'demo/*.js', js + 'demo/*/*.js'];

    grunt.initConfig({
        concat: options,
        uglify: options,
        watch: {
            scripts: {
                files: [
                    js + '**.js',
                    js + '**/**.js'
                ],
                tasks: ['debug']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('debug', ['concat']);
    grunt.registerTask('release', ['uglify']);
};