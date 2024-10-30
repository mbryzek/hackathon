# Parse the init function for the page
class ElmInit
    def initialize(has_param, has_cmd, requires_logged_in, requires_logged_in_with_group, is_login_page, is_logout_page)
        @has_cmd = has_cmd
        @has_param = has_param
        @requires_logged_in = requires_logged_in
        @requires_logged_in_with_group = requires_logged_in_with_group
        @is_login_page = is_login_page
        @is_logout_page = is_logout_page
    end

    def has_cmd?
        @has_cmd
    end

    def has_param?
        @has_param
    end

    def requires_logged_in?
        @requires_logged_in
    end

    def requires_logged_in_with_group?
        @requires_logged_in_with_group
    end

    def is_login_page?
        @is_login_page
    end

    def is_logout_page?
        @is_logout_page
    end

    def ElmInit.parse(file, lines)
        if line = lines.find { |l| l.strip.match(/^init\s*\:/) }
            words = line.split(/\s+/).map(&:strip)
            returns = line.split(/\-\>/).map(&:strip).drop(1)
            has_param = returns.length > 1
            has_cmd = returns.last.downcase.match(/cmd\s+msg/)
            requires_logged_in_with_group = words.include?("GlobalStateGroup")
            requires_logged_in = requires_logged_in_with_group || words.include?("GlobalStateLoggedIn")
            is_login_page = File.basename(file).match(/^Login\.elm$/) ? true : false
            is_logout_page = File.basename(file).match(/^Logout\.elm$/) ? true : false    
            ElmInit.new(has_param, has_cmd, requires_logged_in, requires_logged_in_with_group, is_login_page, is_logout_page)
        end
    end
end

class ElmModule
    attr_reader :name, :alias
    def initialize(name)
        @name = name
        @alias = name.gsub(/\./, '')
    end
end

class ElmFile

    attr_reader :module, :init
 
    def initialize(path, module_name, init)
        @path = path
        @module = ElmModule.new(module_name)
        @init = init
    end

    def ElmFile.parse(f)
        contents = File.read(f)
        lines = contents.split("\n")

        module_name = parse_module_name(lines)
        ElmFile.assert(f, module_name, "Failed to parse module name")

        init = ElmInit.parse(f, lines)
        ElmFile.assert(f, init, "Failed to parse init method")

        ElmFile.new(f, module_name, init)
    end

    def ElmFile.raise_error(file, desc)
        raise "[#{file}] #{desc}"
    end

    private
    def ElmFile.assert(file, value, desc)
        if value.nil?
            ElmFile.raise_error(file, desc)
        end
    end

    def ElmFile.parse_module_name(lines)
        line = lines.first.to_s
        if line.match(/^module /)
            line.split(/\s+/).drop(1).first
        else
            nil
        end
    end

    def ElmFile.initLowerCase(v)
        v.sub(/^./) { |first| first.downcase }
    end
end