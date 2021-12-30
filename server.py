from flask import *
from flask_session import Session
from flask_caching import Cache
import json
import time
import logging
import tweet

cache = Cache()

app = Flask(__name__)

# set cache
cache.init_app(app=app, config={"CACHE_TYPE": "filesystem",'CACHE_DIR': '/tmp'})

log = logging.getLogger('werkzeug')
log.disabled = True
app.logger.disabled = True

start_time = time.time()

@app.route('/', methods=['GET'])
def index():

    return render_template("index.html")


@app.route('/getjs', methods=['POST'])
def get_js():
    if request.method == "POST":
        squares_raw = request.get_json()
        squares = json.dumps(squares_raw)

        data_end = tweet.search(squares)
        cache.set("my_value", json.loads(data_end))
        
        return jsonify(data_end)


@app.route('/getjs_st', methods=['POST'])
def get_js_st():
    if request.method == "POST":

        data_end = json.load(open('data\\tweets_start_0.json'))
        cache.set("my_value", data_end)
        
        return jsonify(data_end)



if __name__ == '__main__':
    app.run(port=5000)
