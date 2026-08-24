from pymongo import MongoClient


def get_mongo_client(uri, username=None, password=None):
    if username and password:
        return MongoClient(uri, username=username, password=password)
    return MongoClient(uri)


def get_database(client, db_name):
    return client[db_name]
