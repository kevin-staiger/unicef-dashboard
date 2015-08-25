/**
 * Master Controller
 */

angular.module('RDash')
    .controller('MasterCtrl', ['$scope', '$http', '$cookieStore', MasterCtrl]);

function MasterCtrl($scope, $cookieStore) {
    console.log('loaded')
    /**
     * Sidebar Toggle & Cookie Control
     */

     $scope.submitForm = function(isValid) {
        console.log($scope.encryption)
        if (isValid) {
          $http({
            method: "post",
            url: "/api/encrypt",
            data: $.param({
              encryptionData: $scope.encryption.data,
              jobName: $scope.encryption.env,
            }),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
            .success(function (job) { window.location = job.url; })
                    .error(function(response) { alert(response); });
        } else {
          alert('Not Submitted, Error Filling Out Form');
        }
    };

    var mobileView = 992;

    $scope.getWidth = function() {
        return window.innerWidth;
    };

    $scope.$watch($scope.getWidth, function(newValue, oldValue) {
        if (newValue >= mobileView) {
            if (angular.isDefined($cookieStore.get('toggle'))) {
                $scope.toggle = ! $cookieStore.get('toggle') ? false : true;
            } else {
                $scope.toggle = true;
            }
        } else {
            $scope.toggle = false;
        }

    });

    $scope.toggleSidebar = function() {
        $scope.toggle = !$scope.toggle;
        $cookieStore.put('toggle', $scope.toggle);
    };

    window.onresize = function() {
        $scope.$apply();
    };
}