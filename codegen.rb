#!/usr/bin/env ruby


load File.join(File.dirname(__FILE__), "codegen/all.rb")

MAIN_FILE = "src/Main.elm"

all = `find src/Page -type f -name "*elm"`.strip.split("\n").sort

files = all.map do |f|
    ElmFile.parse(f)
end

def generate_lines(context, content)
    all = []
    all << "{--CODEGEN: Start #{context} --}"
    content.each { |l| all << l }
    all << "{--CODEGEN: End #{context} --}"
    all
end

def prepend_spaces(content, n)
    spaces = " " * n
    content.map { |c| c.empty? ? c : spaces ++ c }
end

def replace_imports(contents, files)
  tmp = []
  found = false
  contents.split(/\n/).each do |l|
    if l.strip.match(/^import\s+Page\./)
      if !found
        files.map { |f|
          tmp << "import #{f.module.name} as #{f.module.alias}"
        }
        found = true
      end
    else
      tmp << l
    end
  end
  if !found
      raise "Could not find imports in file #{MAIN_FILE}"
  end
  tmp.join("\n")
end

def generate_to_page(files)
  all = []
  all << "toPage : IntermediateState -> Maybe Session -> Route.Route -> (Page, Cmd MainMsg)"
  all << "toPage state session route ="
  all << "    case route of"
  files.each_with_index { |f, i|
    all << "" if i > 0
    init_param = f.init.has_param? ? " params": ""
    all << "        Route.#{f.module.alias}#{init_param} ->"

    session = f.init.requires_logged_in? ? "auth" : "(toGlobalState state session)"

    spaces = " " * 12
    page_call = []
    if f.init.has_cmd?
      page_call << "#{spaces}let"
      page_call << "#{spaces}    (model, msg) = #{f.module.alias}.init #{session}"
      page_call << "#{spaces}in"
      page_call << "#{spaces}(#{f.module.alias} model, Cmd.map PageMsg (Cmd.map #{f.module.alias}Msg msg))"
    else
      page_call << "#{spaces}(#{f.module.alias} (#{f.module.alias}.init #{session}#{init_param}), Cmd.none)"
    end

    if f.init.requires_logged_in?
      method = f.init.requires_logged_in_with_group? ? "loggedInWithGroupPage" : "loggedInPage"
      updated_call = [spaces + method + ' state session (\auth ->']
      page_call.each { |pc| updated_call << "    #{pc}" }
      updated_call << "#{spaces})"

      all = all + updated_call
    else
      all = all + page_call
    end
  }
  all
end

def generate_type_page(files)
    content = ["type Page"]
    files.each_with_index { |f, i|
        sep = i == 0 ? "=" : "|"
        content << "    #{sep} #{f.module.alias} #{f.module.alias}.Model"
    }
    content
end

def generate_type_main_page_msg(files)
    content = ["type MainPageMsg"]
    files.each_with_index { |f, i|
        sep = i == 0 ? "=" : "|"
        content << "    #{sep} #{f.module.alias}Msg #{f.module.alias}.Msg"
    }
    content
end

def generate_page_view(files)
    content = []
    files.each_with_index { |f, i|
        content << "" if i > 0
        content << "#{f.module.alias} pageModel ->"
        content << "    #{f.module.alias}.view pageModel"
        content << "        |> Html.map #{f.module.alias}Msg"
        content << "        |> Html.map PageMsg"
    }

    all = []
    all << "pageView : Page -> Html MainMsg"
    all << "pageView page ="
    all << "    case page of"
    prepend_spaces(content, 8).each { |l| all << l }
    all
end

def generate_handle_page_msg(files)
    spaces = " " * 8
    content = []
    files.each_with_index { |f, i|
        content << "" if i > 0
        content << "(#{f.module.alias}Msg pageMsg, #{f.module.alias} pageModel) ->"
        content << "    let"
        content << "        (newModel, newCmd) = #{f.module.alias}.update pageMsg pageModel"
        content << "    in"


        map_model_cmd = "    ({ model | page = Just (#{f.module.alias} newModel) }, Cmd.map PageMsg (Cmd.map #{f.module.alias}Msg newCmd))"
        if f.init.is_login_page?
          content << "    handleLogin (ApiRequest.toMaybe newModel.loginRequest) ("
          content << "    #{map_model_cmd}"
          content << "    )"
        elsif f.init.is_logout_page?
          content << "    handleLogout (ApiRequest.toMaybe newModel.logoutRequest) ("
          content << "    #{map_model_cmd}"
          content << "    )"
        else
            content << map_model_cmd
        end

        content << ""
        content << "(#{f.module.alias}Msg _, _) ->"
        content << "    (model, Cmd.none)"
    }

    all = []
    all << "handlePageMsg : MainPageMsg -> Model -> ( Model, Cmd MainMsg )"
    all << "handlePageMsg msg model ="
    all << "    case model.page of"
    all << "        Nothing ->"
    all << "            (model, Cmd.none)"
    all << ""
    all << "        Just p ->"
    all << "            case ( msg, p ) of"
    prepend_spaces(content, 16).each { |l| all << l }
    all
end

CODEGEN_START = "-- CODEGEN START"
def read_file_until_codegen(file)
  all = []
  IO.readlines(file).each do |l|
    all << l.chomp
    break if l.strip == CODEGEN_START
  end
  all
end

all = read_file_until_codegen(MAIN_FILE)
all << generate_type_page(files) << "\n"
all << generate_type_main_page_msg(files) << "\n"
all << generate_to_page(files) << "\n"
all << generate_page_view(files) << "\n"
all << generate_handle_page_msg(files)

contents = replace_imports(all.join("\n"), files)

File.open(MAIN_FILE, "w") do |f|
  f << contents
end

puts "Look at #{MAIN_FILE}"
puts ""
