import configparser
import os

class readConf(object):
    def GetwebsocketParam(self):
        # Priority: Environment variable > Config file
        port = os.environ.get('WEBSOCKET_PORT')
        if port:
            return port
            
        current_directory = os.getcwd()
        config = configparser.ConfigParser()
        # Support both Windows and Unix path separators
        config_path = os.path.join(current_directory, "config", "set.conf")
        try:
            config.read(config_path, encoding="utf-8")
            val = config.get('websocket', 'port')
            return val
        except:
            return "7788"  # Default port
    
    def GetDBParam(self):
        # Priority: Environment variable > Config file
        db_url = os.environ.get('DATABASE_URL')
        if db_url:
            # Convert to psycopg3 dialect if using postgresql://
            if db_url.startswith('postgresql://'):
                db_url = db_url.replace('postgresql://', 'postgresql+psycopg://', 1)
            print(f"Using DATABASE_URL from environment: {db_url[:50]}...")
            return db_url
            
        current_directory = os.getcwd()
        print(f"Current directory: {current_directory}")
        config = configparser.ConfigParser()
        config_path = os.path.join(current_directory, "config", "set.conf")
        
        try:
            config.read(config_path, encoding="utf-8")
            url = config.get('db', 'url')
            # Convert to psycopg3 dialect if using postgresql://
            if url.startswith('postgresql://'):
                url = url.replace('postgresql://', 'postgresql+psycopg://', 1)
            print(f"Using DB URL from config: {url[:50]}...")
            return url
        except Exception as e:
            print(f"Error reading config: {e}")
            # Fallback to Supabase PostgreSQL with psycopg3 dialect
            return "postgresql+psycopg://postgres.wdieynendfjbkbhfovrx:Renaat1024@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
    
    def GetUploadParam(self):
        # Use temporary directory for uploads in production
        upload_path = os.environ.get('UPLOAD_PATH')
        if upload_path:
            return upload_path
        
        # Try to create uploads directory in current path
        current_directory = os.getcwd()
        upload_dir = os.path.join(current_directory, "uploads")
        
        try:
            os.makedirs(upload_dir, exist_ok=True)
            return upload_dir
        except:
            # Fallback to temp directory
            import tempfile
            return tempfile.gettempdir()
if __name__ == "__main__":
    # config = configparser.ConfigParser()  # 创建对象
    # config.read("set.conf", encoding="utf-8")  # 读取配置文件，如果配置文件不存在则创建
    # # 查询类方法
    # secs = config.sections()  # 获取所有的节点名称
    # print("所有的节点名称:", secs)
    #
    # val = config.has_section('websocket')  # 检查指定节点是否存在，返回True或False
    # print("指定节点是否存在:", val)
    # val = config.has_option('websocket', 'port')  # 检查指定节点中是否存在某个key，返回True或False
    # print("指定节点中是否存在某个key:", val)
    # val = config.has_option('websocket', 'host')  # 检查指定节点中是否存在某个key，返回True或False
    # print("指定节点中是否存在某个key:", val)
    #
    # item_list = config.items('websocket')  # 获取指定节点的键值对
    # print("指定节点的键值对:", item_list)
    # val = config.get('websocket', 'host')  # 获取指定节点的指定key的value
    # print("指定节点的指定key的value:", val)
    #
    # val = config.get('db', 'url')  # 获取指定节点的指定key的value
    # print("指定节点的指定key的value:", val)

    read = readConf()
    print(read.GetwebsocketParam())
    print(read.GetDBParam())