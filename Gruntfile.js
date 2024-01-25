const fs = require('fs');
module.exports = function (grunt) {
    require('time-grunt')(grunt);

    var serverConfigName = grunt.option('server') || 'ori';
    // Pull defaults (including username and password) from .screeps.json
    var config = require('./.screeps.json')[serverConfigName]
    console.log(`option: ${serverConfigName}`)
    // Allow grunt options to override default configuration
    var branch = grunt.option('branch') || config.branch;
    var email = grunt.option('email') || config.email;
    var password = grunt.option('password') || config.password;
    var ptr = grunt.option('ptr') ? true : config.ptr
    var private_directory = grunt.option('private_directory') || config.private_directory;

    let host = undefined;
    let port = undefined;
    let http = undefined;
    if (config.private === true) {
        host = grunt.option('host') || config.server.host;
        port = grunt.option('port') || config.server.port;
        http = grunt.option('http') || config.server.http;
    }

    var buildCounterPath = '.buildcounter';
    var buildCounter = 1;
    if (fs.existsSync(buildCounterPath)) {
        buildCounter = parseInt(fs.readFileSync(buildCounterPath, 'utf-8')) || 1;
    }

    var currentdate = new Date();
    grunt.log.subhead('Task Start: ' + currentdate.toLocaleString())
    grunt.log.writeln('Branch: ' + branch)

    // Load needed tasks
    grunt.loadNpmTasks('grunt-screeps')
    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-file-append')
    grunt.loadNpmTasks("grunt-jsbeautifier")
    grunt.loadNpmTasks("grunt-rsync")
    grunt.loadNpmTasks("grunt-text-replace")
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({

        // Push all files in the dist folder to screeps. What is in the dist folder
        // and gets sent will depend on the tasks used.
        screeps: {
            options: {
                server: {
                    host: host,
                    port: port,
                    http: http
                },
                email: email,
                password: password,
                branch: branch,
                ptr: ptr
            },
            dist: {
                src: ['dist/*.js', 'movement.js']
            }
        },



        // Copy all source files into the dist folder, flattening the folder
        // structure by converting path delimiters to underscores
        copy: {
            // Pushes the game code to the dist folder so it can be modified before
            // being send to the screeps server.
            screeps: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: '**',
                    dest: 'dist/',
                    filter: 'isFile',
                    rename: function (dest, src) {
                        return  dest + src.replace(/\//g,'_');
                        // console.log(`rename in[${src}] out[${rename}]`)
                        // Change the path name utilize underscores for folders
                        // return rename;
                    },
                    // flatten: true
                }],
            }
        },

        replace: {
            // Replace '/' with '_' in the 'require' paths inside JS files in 'dist' folder
            paths: {
                src: ['dist/*.js'],
                overwrite: true,
                replacements: [
                    {
                        // Replace '/' with '_' in 'require' paths excluding './'
                        from: /require\('([^']+?)'\)/g,
                        to: (match) => {
                            const base = 'require(\'';
                            const raw = match.startsWith(base)
                                ? match.substring(base.length) : match;
                            const r1 = raw.startsWith('./') ? raw.substring('./'.length) : raw
                            const replace = r1
                                .replace('src/', '')
                                .replace(/\.\.\//g, '')
                                .replace(/\//g, '_')
                            // console.log(`in[${match}] raw[${raw}] r1[${raw}] end[${replace}] [${base + replace}]`)
                            return base + replace
                        }
                    },
                    {
                        // Replace $VERSION with custom version format
                        from: /\$VERSION/g,
                        to: () => {
                            const day = currentdate.getDate().toString().padStart(2, '0');
                            const month = (currentdate.getMonth() + 1).toString().padStart(2, '0');
                            const year = currentdate.getFullYear().toString().substring(2);
                            const hours = currentdate.getHours().toString().padStart(2, '0');
                            const minutes = currentdate.getMinutes().toString().padStart(2, '0');

                            // Increment the build counter for the next build
                            buildCounter++;
                            // Write the updated build counter to the file
                            fs.writeFileSync(buildCounterPath, buildCounter.toString(), 'utf-8');

                            return `'1.0.2-${buildCounter}@${day}.${month}.${year}-${hours}:${minutes}';`
                        }
                    },
                ]
            }
        },

        uglify: {
            // my_target: {
            //     files: [{
            //         src: "dist/*.js",
            //         dest: "screepsBot.min.js"
            //     }]
            // },
            dev: {
                options: {
                    sourceMap: true,
                    //     beautify: true
                },
                files: [{
                    expand: true,
                    src: ['dist/*.js'],
                    dest: 'dist/',
                    cwd: '.',
                    rename: function (dst, src) {
                        // To keep the source js files and make new files as `*.min.js`:
                        // return dst + '/' + src.replace('.js', '.min.js');
                        // Or to override to src:
                        return src;
                    }
                }]
            }
        },

        // Copy files to the folder the client uses to sink to the private server.
        // Use rsync so the client only uploads the changed files.
        rsync: {
            options: {
                args: ["--verbose", "--checksum"],
                exclude: [".git*"],
                recursive: true
            },
            private: {
                options: {
                    src: './dist/',
                    dest: private_directory,
                }
            },
        },


        // Add version variable using current timestamp.
        file_append: {
            versioning: {
                files: [
                    {
                        append: "\nglobal.SCRIPT_VERSION = "+ currentdate.getTime() + "\n",
                        input: 'dist/version.js',
                    }
                ]
            }
        },


        // Remove all files from the dist folder.
        clean: {
            'dist': ['dist']
        },


        // Apply code styling
        jsbeautifier: {
            modify: {
                src: ["src/**/*.js"],
                options: {
                    config: '.jsbeautifyrc'
                }
            },
            verify: {
                src: ["src/**/*.js"],
                options: {
                    mode: 'VERIFY_ONLY',
                    config: '.jsbeautifyrc'
                }
            }
        },
    })

    // Combine the above into a default task
    grunt.registerTask('default',  ['clean', 'copy:screeps', 'replace', 'uglify', 'file_append:versioning', 'screeps']);
    grunt.registerTask('debug',  ['clean', 'copy:screeps', 'replace', 'file_append:versioning', 'screeps']);

    grunt.registerTask('private',  ['clean', 'copy:screeps', 'replace', 'uglify', 'file_append:versioning', 'screeps']);
    grunt.registerTask('private_debug',  ['clean', 'copy:screeps', 'replace', 'file_append:versioning', 'screeps']);

}