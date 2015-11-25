$(function(){

    var RatingModel = Backbone.Model.extend({
        default: {
            id: 0,
            name: "name",
            points: 0
        },

        initialize: function(){}

    });

    var RatingsCollection = Backbone.Collection.extend({
        model: RatingModel,
        sortParam: 'points',
        sortMode: 1,
        comparator: function(a,b){
          if (a.get(this.sortParam) < b.get(this.sortParam)) return this.sortMode
          if (a.get(this.sortParam) > b.get(this.sortParam)) return -1*this.sortMode
        },
        initialize: function() {
            this.on('change:points', function() { this.sort() }, this);
        },


        update: function(objects){
            var collection = this
            _.each(objects, function(obj){
                var cur_model = _.findWhere(collection.models, {id: obj['id']});
                cur_model.set({points: obj["points"]});
            })
        }
    });

    var RatingView = Backbone.View.extend({
        el: 'tbody.score_body',
        model: RatingModel,
        template: _.template($("#score_tr").html()),

        initialize: function(){
            this.initSocket();
            this.collection.on('all', function() { this.render() }, this);
        },

        modelChanged: function(){
            console.log("modelChanged")
        },

        getRatings: function(){
            var view = this;
            var url = "http://rating.smartjs.academy/rating";
            $.get(url).success().done(function(response){
                view.current_version = response.version
                view.collection.add(response.records);
                console.log(view.collection);
                view.render()
            })
        },

        initSocket: function(){
            var view = this;
            var socket_url = "ws://rating.smartjs.academy/rating";
            var socket = new WebSocket(socket_url);
            socket.onopen = function(){
                console.log("Connection is open");
            };

            socket.onmessage = function(response){
                var parsed_data = JSON.parse(response.data)
                if (parsed_data.status == "CONNECTED") {
                    view.getRatings()
                }
                else {
                    if (view.current_version == parsed_data.fromVersion ) {
                        view.current_version = parsed_data.toVersion
                        view.collection.update(parsed_data.updates)
                    }else{
                    console.log("Missed version")
                }
                }
            };
        },

        render: function(){
            this.$el.html(this.template({ratings: this.collection.toJSON()}))
            return this
        }
    });

    var view = new RatingView({collection: new RatingsCollection})
});