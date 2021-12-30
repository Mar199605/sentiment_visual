import os
import time
import csv
import json
import re
import twint

from cleantext import clean
from textblob import TextBlob

from google.cloud import translate_v2
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = r"C:\\Users\\ht_ma\\env\\service-account-file.json" # Key needed
translate_client_0 = translate_v2.Client()

## Another translator
# from googletrans import Translator
# translate_client_1 = Translator()


def search(squares):
    start_time = time.time()
    print(f"\n--- {'{:.2f}'.format((start_time - start_time))} seconds ---")

    # Read squares csvfile
    squares = json.loads(squares)
    jsonWriter(json.dumps(squares, indent=4), "data\\raw.json")

    # # Get geo_location
    geos = geo_locations(squares)

    # Search tweet
    limit = 20
    search_tweets(geos, limit ,"data\\tweets_raw.csv", "600km", 1)

    # # Process result
    row_1 = process_tweets_row("data\\tweets_raw.csv", limit=10, translate=False, show=True)
    print("Process result    complete")

    # jsonString_1 = row_to_json(row_1)
    # jsonWriter(jsonString_1, "data\\tweets_1.json")

    # Add more info
    row_2 = add_info_row(row_1, squares)
    print("Add more info     complete")

    # jsonString_2 = row_to_json(row_2)
    jsonWriter(jsonString_2, "data\\tweets_2.json")

    # Simplify
    row_3 = simplify_row(row_2, average=True)
    print("Simplify          complete")

    jsonString_3 = row_to_json(row_3)
    jsonWriter(jsonString_3, "data\\tweets_end.json")

    # Output Json
    print("Output            complete")

    # Record Time
    print(f"--- {'{:.2f}'.format((time.time() - start_time))} seconds ---")

    # with open('data\\tweets_end_0.json', 'r') as myfile:
    #     jsonString_3 =myfile.read()
    
    # time.sleep(2)
    
    return jsonString_3


def csvWriter(rows, outputCsvPath):
    with open(outputCsvPath, "w", newline="", encoding="utf-8") as write_obj:
        csv_writer = csv.writer(write_obj)
        for row in rows:
            csv_writer.writerow(row)

    return


def remove_content(text):
    text = re.sub(r"http\S+", "", text)  # remove urls
    text = re.sub(r"\S+\.com\S+", "", text)  # remove urls
    text = re.sub(r"\@\w+", "", text)  # remove mentions
    text = text.replace("?", "")  # remove question mark
    return text


def text_clean(text):
    text = clean(text,
                 fix_unicode=True,               # fix various unicode errors
                 to_ascii=False,                  # transliterate to closest ASCII representation
                 lower=True,                     # lowercase text
                 # fully strip line breaks as opposed to only normalizing them
                 no_line_breaks=True,
                 no_urls=True,                  # replace all URLs with a special token
                 no_emails=True,                # replace all email addresses with a special token
                 no_phone_numbers=True,         # replace all phone numbers with a special token
                 no_numbers=True,               # replace all numbers with a special token
                 no_digits=True,                # replace all digits with a special token
                 no_currency_symbols=True,      # replace all currency symbols with a special token
                 no_punct=True,                 # remove punctuations
                 replace_with_punct="",          # instead of removing punctuations you may replace them
                 replace_with_url="",
                 replace_with_email="",
                 replace_with_phone_number="",
                 replace_with_number="",
                 replace_with_digit="",
                 replace_with_currency_symbol="",
                 lang="en"                       # set to 'de' for German special handling
                 )
    return text


def row_to_json(rows):
    jsonArray = []
    count = 0
    for row in rows:
        if count > 0:
            row = dict(zip(rows[0], rows[count]))
            # add this python dict to json array
            jsonArray.append(row)
        count += 1

    jsonString = json.dumps(jsonArray, indent=4)

    return jsonString


def jsonWriter(jsonString, jsonFilePath):
    # print(json.loads(jsonString))
    # convert python jsonArray to JSON String and write to file
    with open(jsonFilePath, 'w', encoding='utf-8') as jsonf:
        jsonf.write(jsonString)


def read_squares(csvFilePath):
    squares = []
    with open(csvFilePath, "r") as csvfile:
        reader = csv.reader(csvfile)
        next(reader)
        for row in reader:
            squares.append(
                {
                    "id": row[0],
                    "x": row[1],
                    "y": row[2],
                    "lon": row[3],
                    "lat": row[4],
                    "code": row[5],
                }
            )
    return squares


def geo_locations(list):
    geos = []
    for square in list:
        lon = square["lon"]
        lat = square["lat"]
        geos.append([str(lat) + "," + str(lon)])
    return geos


def search_tweets(geos, limit, outputPath, radius, error_interval):
    for geo in geos:
        c = twint.Config()
        c.Limit = limit
        c.Output = outputPath
        c.Custom["tweet"] = ["id", "geo", "username", "tweet"]
        c.Store_csv = True
        c.Geo = str(geo[0]) + "," + str(radius)
        success = False
        retries = 0

        while not success:
            if retries < 20:
                try:
                    twint.run.Search(c)
                    success = True
                except:
                    print("retrying", retries)
                    time.sleep(error_interval)  # wait for token
                    retries += 1
            else:
                try:
                    twint.run.Search(c)
                    success = True
                except:
                    print("retrying_wait", retries)
                    time.sleep(10)  # wait for token
                    retries += 1


def sentiment_analyse(text, translate, show):
    text_count = 0
    text_origin = text

    text = remove_content(text)
    text = text_clean(text)
    text_count += len(text)
    text_translated = None

    # google api translation
    if translate and text != '' and text != None:
        text_trans = translate_client_0.translate(
            text, "en")['translatedText']  # translation
        text = text_trans
        text_translated = text

    # if translate and text != '' and text != None:
    #     # translation and error detect
    #     success = False
    #     retries = 0
    #     while not success and retries <= 10:
    #         try:
    #             # translate_client_1= Translator(service_urls=['translate.google.com','translate.google.co.jp','translate.google.co.kr','translate.google.ca'])
    #             text_trans = translate_client_1.translate_1(text, "en")  # translation
    #             if text_trans == text:
    #                 raise Exception("same result")
    #             text = text_trans.text
    #             text_translated = text
    #             success = True
    #         except:
    #             if retries < 3:
    #                 time.sleep(1)
    #             else:
    #                 time.sleep(10)
    #             retries += 1
    #             print(f"Error text = {text}")
    #             print(f"Retry {retries} times")

    blob = TextBlob(text)
    sent_result = blob.sentiment

    result = [sent_result, text_count, text_translated]
    if show:
        print(f"origin={text_origin}", f"\ntranslation = {result[2]}",
              f"\n{result[0]}", f"characters = {result[1]}", end='\n\n')

    return result


def process_tweets_row(inputCsvPath, limit, translate, show):
    row_0 = []

    with open(inputCsvPath, "r", encoding="unicode_escape") as read_obj:
        
        csv_reader = csv.reader(read_obj)
        
        limit = limit
        count = 0
        geo_0 = ''
        geo_1 = 'geo'
        text_count = 0

        for row in csv_reader:
            if len(row) == 4:
                geo_0 = str(row[1])

                if geo_1 == 'geo' and count == 0:
                    row.append("translation")
                    row.append("sentiment")
                    row_0.append(row)

                elif count < limit and geo_1 != 'geo':
                    analyse_result = sentiment_analyse(
                        row[3], translate, show)  # sentimental analyse text
                    text_count += analyse_result[1]
                    text_sent = analyse_result[0].polarity

                    text_trans = analyse_result[2]  # add translation
                    row.append(text_trans)  # add translation to row
                    row.append(text_sent)  # add sentiment to row

                    row_0.append(row)

                if geo_1 != geo_0:
                    count = 0
                    geo_1 = geo_0
                else:
                    count += 1
        print(f"Charactors in total = {text_count}")

    return row_0


def add_info_row(rows, list):
    squares = list
    count = 0

    for row in rows:
        if count == 0:
            row.append("x")  # add x column
            row.append("y")  # add y column
            row.append("code")  # add code column
            row.append("raw_id")  # add code column

            count += 1

        else:
            geo = row[1]
            geo_lon = geo.split(",")[1]
            geo_lat = geo.split(",")[0]

            x = None
            y = None
            code = None
            raw_id = None
            success = False

            for item in squares:
                if str(item['lat']) == str(geo_lat) and str(item['lon']) == str(geo_lon):
                    x = item['x']
                    y = item['y']
                    code = item['code']
                    raw_id = item['id']
                    row.append(x)
                    row.append(y)
                    row.append(code)
                    row.append(raw_id)
                    success = True
                    break

            if not success:
                # print(row)
                print("error")
                continue
            count += 1

    return rows


def simplify_row(rows, average):

    count = 0
    geo_0 = ''
    geo_1 = 'geo'
    t_sent = 0

    # delete = []
    # delete.append(rows[0].index('username'))  # remove username
    # delete.append(rows[0].index('tweet'))  # remove tweet
    # delete.append(rows[0].index('translation'))  # remove translation
    # delete.sort(reverse=True)

    # move = []
    # move.append(rows[0].index('sentiment')-len(delete))  # move sentiment

    for row in rows:
        geo = None
        geo_0 = str(row[1])

        # for i in delete:  # remove
        #     row.remove(row[i])

        # change sentiment location
        # for i in move:
        #     sen = row[i]
        #     row.remove(row[i])
        #     row.insert(len(row), sen)

        if geo_1 == 'geo' and count == 0:
            if average:
                row.append("ave_sent")
            count += 1
            continue

        geo = str(row[1]).split(',')
        geo = geo[0]+','+geo[1]
        row[1] = geo

        if geo_1 != geo_0:  # new location
            t_sent = 0  # sentimental counter
            t_sent += float(row[rows[0].index('sentiment')])  # calculate total
            count = 0  # same location counter
            ave_sent = t_sent/(count+1)  # calculate average
            row.append(ave_sent)  # add average
            geo_1 = geo_0

        else:  # resume location
            count += 1
            t_sent += float(row[rows[0].index('sentiment')])
            ave_sent = t_sent/(count+1)
            row.append(ave_sent)
    return rows


if __name__ == "__main__":
    search()
